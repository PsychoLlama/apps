import { bindRuntime, createTestRuntime } from '../bindings';
import { defineFold } from '../fold';
import { createRuntime } from '../runtime';
import {
  all,
  atomic,
  call,
  commit,
  defineSaga,
  drive,
  read,
  spawn,
  type DriveContext,
  type SagaInvocation,
} from '../saga';
import { defineScope } from '../scope';
import { defineStore } from '../space';
import { defineTopic } from '../topic';

interface Counter {
  count: number;
}

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
};

/** Let queued macrotasks (and everything before them) drain. */
const settle = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve);
  });

const setup = (options?: Parameters<typeof createTestRuntime>[0]) => {
  const scope = defineScope();
  const counter = defineStore<Counter>(scope, () => ({ count: 0 }));
  const added = defineTopic<number>();
  const tagged = defineTopic<string>();

  defineFold(added, [counter], (draft, amount) => {
    draft.count += amount;
  });

  const bound = createTestRuntime(options);
  const release = bound.anchor(scope);

  return { ...bound, scope, counter, added, tagged, release };
};

describe('defineSaga / run', () => {
  it('applies committed facts and resolves with the return value', async () => {
    const { run, ledger, peek, counter, added, scope } = setup();
    const double = defineSaga(scope, async function* (amount: number) {
      yield commit(added(amount));
      return amount * 2;
    });

    await expect(run(double(4))).resolves.toBe(8);
    expect(peek(counter).count).toBe(4);
    expect(ledger()).toEqual([[added(4)]]);
  });

  it('commits multiple facts from one yield as one transition', async () => {
    const { run, ledger, added, tagged, scope } = setup();
    const saga = defineSaga(scope, async function* () {
      yield commit(added(1), tagged('both'));
    });

    await run(saga());
    expect(ledger()).toEqual([[added(1), tagged('both')]]);
  });

  it('injects the scope signal into capabilities', async () => {
    const { run, ledger, scope, tagged } = setup();
    const seen: AbortSignal[] = [];
    const fetchValue = async (signal: AbortSignal, id: string) => {
      seen.push(signal);
      return `value:${id}`;
    };

    const saga = defineSaga(scope, async function* () {
      const value = yield* call(fetchValue, 'a');
      yield commit(tagged(value));
    });

    await run(saga());
    expect(seen[0]).toBeInstanceOf(AbortSignal);
    expect(ledger()).toEqual([[tagged('value:a')]]);
  });

  it('resolves capability stubs by identity', async () => {
    const real = vi.fn(async () => 'real');
    const stub = vi.fn(async () => 'stub');
    const { run, ledger, scope, tagged } = setup({ calls: [[real, stub]] });

    const saga = defineSaga(scope, async function* () {
      yield commit(tagged(yield* call(real)));
    });

    await run(saga());
    expect(ledger()).toEqual([[tagged('stub')]]);
    expect(real).not.toHaveBeenCalled();
    expect(stub).toHaveBeenCalledTimes(1);
  });

  it('reads snapshots of current state', async () => {
    const { run, commit: send, scope, counter, added } = setup();
    send(added(2));

    const saga = defineSaga(scope, async function* () {
      const snapshot = yield* read(counter);
      return snapshot.count;
    });

    await expect(run(saga())).resolves.toBe(2);
  });

  it('composes sequentially with yield*', async () => {
    const { run, ledger, scope, added } = setup();
    const child = defineSaga(scope, async function* (amount: number) {
      yield commit(added(amount));
      return amount;
    });
    const parent = defineSaga(scope, async function* () {
      const first = yield* child(1);
      const second = yield* child(2);
      return first + second;
    });

    await expect(run(parent())).resolves.toBe(3);
    expect(ledger()).toEqual([[added(1)], [added(2)]]);
  });

  it('capability failures are catchable in-saga', async () => {
    const { run, ledger, scope, tagged } = setup();
    const failing = async (): Promise<never> => {
      throw new Error('nope');
    };

    const saga = defineSaga(scope, async function* () {
      try {
        yield* call(failing);
      } catch (error) {
        yield commit(tagged((error as Error).message));
      }
    });

    await run(saga());
    expect(ledger()).toEqual([[tagged('nope')]]);
  });

  it('uncaught saga errors reject run', async () => {
    const { run, ledger, scope } = setup();
    const saga = defineSaga(scope, async function* () {
      yield* call(async (): Promise<never> => {
        throw new Error('boom');
      });
    });

    await expect(run(saga())).rejects.toThrow('boom');
    expect(ledger()).toEqual([]);
  });

  it('throws when the scope is dead', () => {
    const { run, scope, release } = setup();
    const saga = defineSaga(scope, async function* () {
      yield* [] as never[];
    });

    release();
    expect(() => run(saga())).toThrow(/dead scope/i);
  });

  it('rejects values that are not saga invocations', () => {
    const { run } = setup();
    const plain = (async function* () {
      yield undefined as never;
    })();

    expect(() => run(plain as unknown as SagaInvocation<void>)).toThrow(
      /not a saga invocation/i,
    );
  });
});

describe('all', () => {
  it('runs children concurrently and passes commits through', async () => {
    const { run, ledger, scope, tagged } = setup();
    const gates = { first: deferred<void>(), second: deferred<void>() };
    const started: string[] = [];

    const mark = defineSaga(scope, async function* (name: 'first' | 'second') {
      started.push(name);
      await gates[name].promise;
      yield commit(tagged(name));
      return name;
    });

    const parent = defineSaga(scope, async function* () {
      return yield* all(mark('first'), mark('second'));
    });

    const pending = run(parent());
    await vi.waitFor(() => expect(started).toEqual(['first', 'second']));

    // Finishing out of order proves both concurrency and pass-through:
    // the second child's commit lands before its sibling completes.
    gates.second.resolve();
    await vi.waitFor(() => expect(ledger()).toEqual([[tagged('second')]]));

    gates.first.resolve();
    await expect(pending).resolves.toEqual(['first', 'second']);
    expect(ledger()).toEqual([[tagged('second')], [tagged('first')]]);
  });
});

describe('atomic', () => {
  it('fuses child commits into one transition, in arrival order', async () => {
    const { run, ledger, scope, tagged } = setup();
    const gates = { first: deferred<void>(), second: deferred<void>() };

    const mark = defineSaga(scope, async function* (name: 'first' | 'second') {
      await gates[name].promise;
      yield commit(tagged(name));
      return name;
    });

    const parent = defineSaga(scope, async function* () {
      return yield* atomic(mark('first'), mark('second'));
    });

    const pending = run(parent());
    gates.second.resolve();
    await settle();
    gates.first.resolve();

    await expect(pending).resolves.toEqual(['first', 'second']);
    expect(ledger()).toEqual([[tagged('second'), tagged('first')]]);
  });

  it('discards held facts and cancels siblings when a child fails', async () => {
    const { run, ledger, scope, tagged } = setup();
    const witnessed: string[] = [];

    const hang = (signal: AbortSignal) =>
      new Promise<never>((_resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => {
            witnessed.push('aborted');
            reject(signal.reason as Error);
          },
          { once: true },
        );
      });

    const survivor = defineSaga(scope, async function* () {
      yield commit(tagged('early'));
      yield* call(hang);
    });

    const failing = defineSaga(scope, async function* () {
      await settle();
      yield* call(async (): Promise<never> => {
        throw new Error('exploded');
      });
    });

    const parent = defineSaga(scope, async function* () {
      yield* atomic(survivor(), failing());
    });

    await expect(run(parent())).rejects.toThrow('exploded');
    expect(ledger()).toEqual([]);
    expect(witnessed).toEqual(['aborted']);
  });

  it('lets the saga catch the failure and commit recovery facts', async () => {
    const { run, ledger, scope, tagged } = setup();

    const held = defineSaga(scope, async function* () {
      yield commit(tagged('discarded'));
    });

    const failing = defineSaga(scope, async function* () {
      await settle();
      yield* call(async (): Promise<never> => {
        throw new Error('exploded');
      });
    });

    const parent = defineSaga(scope, async function* () {
      try {
        yield* atomic(held(), failing());
      } catch (error) {
        yield commit(tagged(`recovered:${(error as Error).message}`));
      }
    });

    await run(parent());
    expect(ledger()).toEqual([[tagged('recovered:exploded')]]);
  });
});

describe('spawn', () => {
  it('detaches the child: it outlives the parent and commits directly', async () => {
    const { run, peek, scope, counter, added } = setup();
    const gate = deferred<void>();

    const child = defineSaga(scope, async function* () {
      await gate.promise;
      yield commit(added(7));
    });

    const parent = defineSaga(scope, async function* () {
      yield* spawn(child());
      return 'done';
    });

    await expect(run(parent())).resolves.toBe('done');
    expect(peek(counter).count).toBe(0);

    gate.resolve();
    await vi.waitFor(() => expect(peek(counter).count).toBe(7));
  });

  it('never fuses spawned commits into an enclosing atomic', async () => {
    const { run, ledger, peek, scope, counter, added, tagged } = setup();

    const eager = defineSaga(scope, async function* () {
      yield commit(added(1));
    });

    const spawner = defineSaga(scope, async function* () {
      yield* spawn(eager());
      yield commit(tagged('held'));
    });

    const parent = defineSaga(scope, async function* () {
      yield* atomic(spawner());
    });

    await run(parent());
    await vi.waitFor(() => expect(peek(counter).count).toBe(1));

    expect(ledger()).toContainEqual([added(1)]);
    expect(ledger()).toContainEqual([tagged('held')]);
  });

  it('reports spawned failures to runtime failure listeners', async () => {
    const { run, failures, scope } = setup();

    const explode = defineSaga(scope, async function* () {
      yield* call(async (): Promise<never> => {
        throw new Error('detached boom');
      });
    });

    const parent = defineSaga(scope, async function* () {
      yield* spawn(explode());
    });

    await run(parent());
    await vi.waitFor(() => expect(failures()).toHaveLength(1));
    expect(failures()[0].message).toBe('detached boom');
  });

  it('normalizes non-Error failures from spawned sagas', async () => {
    const { run, failures, scope } = setup();

    const explode = defineSaga(scope, async function* () {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- the non-Error reason is the point
      yield* call(() => Promise.reject('raw failure'));
    });

    const parent = defineSaga(scope, async function* () {
      yield* spawn(explode());
    });

    await run(parent());
    await vi.waitFor(() => expect(failures()).toHaveLength(1));
    expect(failures()[0]).toBeInstanceOf(Error);
    expect(failures()[0].message).toBe('raw failure');
  });

  it('escalates loudly when no failure listener is registered', async () => {
    const scope = defineScope();
    const bound = bindRuntime(createRuntime());
    const release = bound.anchor(scope);
    const spy = vi
      .spyOn(globalThis, 'queueMicrotask')
      .mockImplementation(() => undefined);

    const explode = defineSaga(scope, async function* () {
      yield* call(async (): Promise<never> => {
        throw new Error('unobserved boom');
      });
    });

    const parent = defineSaga(scope, async function* () {
      yield* spawn(explode());
    });

    try {
      await bound.run(parent());
      await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));

      const queued = spy.mock.calls[0][0];
      expect(() => queued()).toThrow('unobserved boom');
    } finally {
      spy.mockRestore();
      release();
    }
  });
});

describe('drive internals', () => {
  const obedient = (signal: AbortSignal) =>
    new Promise<never>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason as Error), {
        once: true,
      });
    });

  const noopContext = (signal: AbortSignal): DriveContext => ({
    signal,
    sink: () => undefined,
    call: (innerSignal, fn, args) =>
      (fn as (...rest: unknown[]) => unknown)(innerSignal, ...args),
    read: () => undefined,
    spawn: () => undefined,
  });

  it('rejects immediately on an already-aborted signal', async () => {
    const controller = new AbortController();
    controller.abort(new Error('already aborted'));

    const gen = (async function* () {
      yield* [] as never[];
    })();

    await expect(drive(gen, noopContext(controller.signal))).rejects.toThrow(
      'already aborted',
    );
  });

  it('normalizes non-Error abort reasons', async () => {
    const controller = new AbortController();
    controller.abort('raw reason');

    const gen = (async function* () {
      yield* [] as never[];
    })();

    await expect(drive(gen, noopContext(controller.signal))).rejects.toThrow(
      /aborted/i,
    );
  });

  it('normalizes non-Error abort reasons across block boundaries', async () => {
    const controller = new AbortController();

    const child = (async function* () {
      yield* call(obedient);
    })();

    const parent = (async function* () {
      yield* atomic(child);
    })();

    const pending = drive(parent, noopContext(controller.signal));
    await settle();
    controller.abort('raw reason');

    await expect(pending).rejects.toThrow(/aborted/i);
  });
});

describe('scope release', () => {
  it('aborts atomic blocks and discards their held facts', async () => {
    const { run, ledger, scope, tagged, release } = setup();

    const obedient = (signal: AbortSignal) =>
      new Promise<never>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason as Error), {
          once: true,
        });
      });

    const child = defineSaga(scope, async function* () {
      yield commit(tagged('held'));
      yield* call(obedient);
    });

    const parent = defineSaga(scope, async function* () {
      yield* atomic(child(), child());
    });

    const pending = run(parent());
    await settle();
    release();

    await expect(pending).rejects.toThrow(/aborted/i);
    expect(ledger()).toEqual([]);
  });

  it('cancels spawned sagas silently: abort is not a failure', async () => {
    const { run, failures, scope, release } = setup();

    const obedient = (signal: AbortSignal) =>
      new Promise<never>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason as Error), {
          once: true,
        });
      });

    const child = defineSaga(scope, async function* () {
      yield* call(obedient);
    });

    const parent = defineSaga(scope, async function* () {
      yield* spawn(child());
    });

    await run(parent());
    await settle();
    release();
    await settle();

    expect(failures()).toEqual([]);
  });

  it('aborts in-flight sagas, even when the capability ignores its signal', async () => {
    const { run, ledger, scope, added, release } = setup();
    let cleaned = false;

    const hangForever = () => new Promise<never>(() => undefined);

    const saga = defineSaga(scope, async function* () {
      try {
        yield commit(added(1));
        yield* call(hangForever);
        yield commit(added(99));
      } finally {
        cleaned = true;
      }
    });

    const pending = run(saga());
    await vi.waitFor(() => expect(ledger()).toEqual([[added(1)]]));

    release();

    await expect(pending).rejects.toThrow(/aborted/i);
    expect(cleaned).toBe(true);
    expect(ledger()).toEqual([[added(1)]]);
  });

  it('disposes for-await event streams via generator closure', async () => {
    const { run, ledger, scope, added, release } = setup();
    let disposed = false;

    const events = async function* () {
      try {
        yield 1;
        yield 2;
      } finally {
        disposed = true;
      }
    };

    const waitForRelease = (signal: AbortSignal) =>
      new Promise<never>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason as Error), {
          once: true,
        });
      });

    const follow = defineSaga(scope, async function* () {
      for await (const amount of events()) {
        yield commit(added(amount));
        yield* call(waitForRelease);
      }
    });

    const pending = run(follow());
    await vi.waitFor(() => expect(ledger()).toEqual([[added(1)]]));

    release();

    await expect(pending).rejects.toThrow(/aborted/i);
    expect(disposed).toBe(true);
  });
});
