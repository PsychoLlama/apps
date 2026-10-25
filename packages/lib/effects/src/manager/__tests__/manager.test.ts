import {
  createEffect,
  createRoot,
  createSignal,
  type Accessor,
  type Setter,
} from 'solid-js';
import { collect, pipe } from '../../combinators';
import { toPromise, type Async, type Sync } from '../../eventual';
import { reactive, resource, yieldOf } from '../../task';
import { isWrapped } from '../../task/output';
import {
  AbandonedError,
  acquire,
  compute,
  createManager,
  inspect,
  release,
  type Handle,
  type Manager,
} from '../manager';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Compute as a promise, whether or not the plan waits. */
const computed = async (manager: Manager, handle: Handle) =>
  toPromise(compute(manager, handle));

/** The raw output, wrappers included. */
const raw = (handle: Handle) => {
  const state = inspect(handle, handle.output);
  assert(state.step === 'succeeded');
  return state.output;
};

/** The output as downstream tasks receive it. */
const output = (handle: Handle) => {
  const state = inspect(handle, handle.output);
  return state.step === 'succeeded' ? yieldOf(state.output) : state;
};

describe('manager', () => {
  describe('compute', () => {
    it('runs a pipeline and exposes node states', async () => {
      const manager = createManager();
      const one = () => 1;
      const double = (value: number) => value * 2;
      const handle = acquire(pipe([one, double]));

      expect(inspect(handle, handle.nodes[0])).toEqual({
        step: 'pending',
      });

      await computed(manager, handle);

      expect(inspect(handle, handle.nodes[0])).toEqual({
        step: 'succeeded',
        input: undefined,
        output: 1,
      });
      expect(inspect(handle, handle.nodes[1])).toEqual({
        step: 'succeeded',
        input: 1,
        output: 2,
      });
    });

    it('collects outputs into an array', async () => {
      const manager = createManager();
      const one = () => 1;
      const two = () => 2;
      const boxed = acquire(collect([one, two]));

      await computed(manager, boxed);

      expect(output(boxed)).toEqual([1, 2]);
    });

    it('awaits async tasks and keeps resources whole', async () => {
      const manager = createManager();
      const stream = resource('stream', () => {});
      const open = async () => stream;
      const handle = acquire(pipe([open]));

      await computed(manager, handle);

      expect(raw(handle)).toEqual(stream);
      expect(output(handle)).toEqual('stream');
    });

    it('passes downstream the values inside wrappers', async () => {
      const manager = createManager();
      const open = () => resource('stream', () => {});
      const both = collect([open, () => 1]);
      const seen = vi.fn((values: [string, number]) => values);
      const handle = acquire(pipe([both, seen]));

      await computed(manager, handle);

      expect(seen).toHaveBeenCalledWith(['stream', 1]);
    });

    it('passes a reactive output downstream as its accessor', async () => {
      const manager = createManager();
      let setMuted!: Setter<boolean>;
      const observe = async () => {
        const [muted, set] = createSignal(false);
        setMuted = set;
        return reactive(muted);
      };
      const seen = vi.fn((state: Accessor<boolean>) => state());
      const handle = acquire(pipe([observe, seen]));

      await computed(manager, handle);
      const state = inspect(handle, handle.nodes[0]);
      assert(state.step === 'succeeded');
      expect(isWrapped(state.output, 'reactive')).toBe(true);
      const muted = yieldOf(state.output) as Accessor<boolean>;

      setMuted(true);
      expect(muted()).toBe(true);
      expect(output(handle)).toEqual(false);
      expect(seen).toHaveBeenCalledOnce();
    });

    it('is idempotent', async () => {
      const manager = createManager();
      const one = vi.fn(() => 1);
      const handle = acquire(pipe([one]));

      await computed(manager, handle);
      await computed(manager, handle);

      expect(one).toHaveBeenCalledTimes(1);
    });

    it("returns a synchronous plan's output right away", () => {
      const manager = createManager();
      const open = () => resource('stream', () => {});
      const handle = acquire(pipe([open, (stream: string) => stream.length]));

      const result = compute(manager, handle);

      expectTypeOf(result).toEqualTypeOf<Sync<number>>();
      expect(result).toEqual({ type: 'sync', value: 6 });
    });

    it('waits for an asynchronous plan, then not once it settles', async () => {
      const manager = createManager();
      const handle = acquire(pipe([async () => 1]));

      const first = compute(manager, handle);
      expectTypeOf(first).toEqualTypeOf<Sync<number> | Async<number>>();
      assert(first.type === 'async');
      await expect(first.value).resolves.toEqual(1);

      expect(compute(manager, handle)).toEqual({ type: 'sync', value: 1 });
    });

    it('throws right away when a synchronous plan fails', () => {
      const manager = createManager();
      const fail = (): number => {
        throw new Error('nope');
      };

      expect(() => compute(manager, acquire(pipe([fail])))).toThrow(
        AggregateError,
      );
    });

    it('refuses a released handle', async () => {
      const manager = createManager();
      const handle = acquire(pipe([() => 1]));
      await release(manager, handle);

      expect(() => compute(manager, handle)).toThrow(/released/);
      await expect(release(manager, handle)).rejects.toThrow(/released/);
    });
  });

  describe('inspect', () => {
    it('tracks node state under a Solid computation', async () => {
      const manager = createManager();
      const gate = Promise.withResolvers<string>();
      const open = () => gate.promise;
      const handle = acquire(pipe([open]));
      const steps: string[] = [];

      const dispose = createRoot((dispose) => {
        createEffect(() => {
          steps.push(inspect(handle, handle.nodes[0]).step);
        });
        return dispose;
      });

      expect(steps).toEqual(['pending']);

      const computing = computed(manager, handle);
      gate.resolve('stream');
      await computing;

      expect(steps).toEqual(['pending', 'computing', 'succeeded']);
      dispose();
    });

    it('refuses a node from another plan', () => {
      const handle = acquire(pipe([() => 1]));
      const other = acquire(pipe([() => 2]));

      expect(() => inspect(handle, other.nodes[0])).toThrow(/not part/);
    });
  });

  describe('cache', () => {
    it('shares entries across handles by task and input identity', async () => {
      const manager = createManager();
      const config = { video: true };
      const getConfig = () => config;
      const open = vi.fn((options: { video: boolean }) => options.video);
      const first = acquire(pipe([getConfig, open]));
      const second = acquire(pipe([getConfig, open]));

      await computed(manager, first);
      await computed(manager, second);

      expect(open).toHaveBeenCalledTimes(1);
      expect(output(second)).toEqual(true);
    });

    it('keeps separate entries for inputs that differ by identity', async () => {
      const manager = createManager();
      const open = vi.fn((options: { video: boolean }) => options.video);
      const first = acquire(pipe([() => ({ video: true }), open]));
      const second = acquire(pipe([() => ({ video: true }), open]));

      await computed(manager, first);
      await computed(manager, second);

      expect(open).toHaveBeenCalledTimes(2);
    });

    it('dedupes work that is still in flight', async () => {
      const manager = createManager();
      const gate = Promise.withResolvers<string>();
      const open = vi.fn(() => gate.promise);
      const first = acquire(pipe([open]));
      const second = acquire(pipe([open]));

      const computing = Promise.all([
        computed(manager, first),
        computed(manager, second),
      ]);
      await settle();

      expect(open).toHaveBeenCalledTimes(1);
      expect(inspect(second, second.nodes[0])).toEqual({
        step: 'computing',
        input: undefined,
      });

      gate.resolve('stream');
      await computing;

      expect(output(second)).toEqual('stream');
    });

    it('shares one output tuple across handles', async () => {
      const manager = createManager();
      const one = () => 1;
      const first = acquire(pipe([one]));
      const second = acquire(pipe([one]));

      await computed(manager, first);
      await computed(manager, second);

      expect(output(first)).toEqual(1);
      expect(raw(second)).toBe(raw(first));
    });

    it('shares downstream work across tasks with equal outputs', async () => {
      const manager = createManager();
      const double = vi.fn((value: number) => value * 2);
      const first = acquire(pipe([() => 1, double]));
      const second = acquire(pipe([() => 1, double]));

      await computed(manager, first);
      await computed(manager, second);

      expect(double).toHaveBeenCalledOnce();
      expect(raw(second)).toBe(raw(first));
    });

    it('keeps an equal output shared while any task still holds it', async () => {
      const manager = createManager();
      const double = vi.fn((value: number) => value * 2);
      const first = acquire(pipe([() => 1, double]));
      const second = acquire(pipe([() => 1, double]));
      await computed(manager, first);
      await computed(manager, second);

      await release(manager, first);
      const third = acquire(pipe([() => 1, double]));
      await computed(manager, third);

      expect(double).toHaveBeenCalledOnce();
      expect(raw(third)).toBe(raw(second));
    });

    it('feeds empty outputs downstream like any other', async () => {
      const manager = createManager();
      const nothing = () => undefined;
      const seen = vi.fn((value: undefined) => value === undefined);
      const handle = acquire(pipe([nothing, collect([seen])]));

      await computed(manager, handle);

      expect(seen).toHaveBeenCalledExactlyOnceWith(undefined);
      expect(output(handle)).toEqual([true]);
    });

    it('frees entries once no handle holds them', async () => {
      const manager = createManager();
      const one = () => 1;
      const first = acquire(pipe([one]));
      await computed(manager, first);

      await release(manager, first);

      expect(manager.cache.entries.task.size).toBe(0);
    });

    it('shares a join and everything downstream of it', async () => {
      const manager = createManager();
      const one = () => 1;
      const two = () => 2;
      const add = (left: number, right: number) => left + right;
      const double = vi.fn((value: number) => value * 2);
      const both = collect([one, two], add);
      const first = acquire(pipe([both, double]));
      const second = acquire(pipe([both, double]));

      await computed(manager, first);
      await computed(manager, second);

      const joined = inspect(first, first.nodes[2]);
      expect(joined).toEqual({
        step: 'succeeded',
        input: undefined,
        output: 3,
      });
      expect(inspect(second, second.nodes[2])).toBe(joined);
      expect(double).toHaveBeenCalledOnce();
    });

    it('shares one collected array while its branches live', async () => {
      const manager = createManager();
      const one = () => 1;
      const two = () => 2;
      const both = collect([one, two]);
      const first = acquire(both);
      const second = acquire(both);

      await computed(manager, first);
      await computed(manager, second);
      const collected = output(first);

      expect(collected).toEqual([1, 2]);
      expect(output(second)).toBe(collected);
    });

    it('collects through a function once while its branches live', async () => {
      const manager = createManager();
      const open = () => resource('stream', () => {});
      const add = vi.fn((stream: string, count: number) => stream + count);
      const both = collect([open, () => 1], add);
      const first = acquire(both);
      const second = acquire(both);

      await computed(manager, first);
      await computed(manager, second);

      expect(add).toHaveBeenCalledExactlyOnceWith('stream', 1);
      expect(raw(first)).toEqual('stream1');
      expect(raw(second)).toBe(raw(first));
    });

    it('shares downstream work by the value a collecting function returns', async () => {
      const manager = createManager();
      const double = vi.fn((value: number) => value * 2);
      const first = acquire(
        pipe([collect([() => 1], (one) => one + 1), double]),
      );
      const second = acquire(pipe([collect([() => 2], (two) => two), double]));

      await computed(manager, first);
      await computed(manager, second);

      expect(double).toHaveBeenCalledOnce();
      expect(output(second)).toEqual(4);
    });

    it('keeps a join per input tuple', async () => {
      const manager = createManager();
      const double = (value: number) => value * 2;
      const add = (left: number, right: number) => left + right;
      const both = collect([double, double], add);
      const first = acquire(pipe([() => 1, both]));
      const second = acquire(pipe([() => 2, both]));

      await computed(manager, first);
      await computed(manager, second);

      expect(output(first)).toEqual(4);
      expect(output(second)).toEqual(8);
      expect(manager.cache.entries.join.get(both)?.size).toBe(2);
    });

    it('resolves a diamond once per handle', async () => {
      const manager = createManager();
      const one = vi.fn(() => 1);
      const double = (value: number) => value * 2;
      const add = (left: number, right: number) => left + right;
      const handle = acquire(pipe([one, collect([double, double], add)]));

      await computed(manager, handle);

      expect(one).toHaveBeenCalledTimes(1);
      expect(output(handle)).toEqual(4);
    });
  });

  describe('failure', () => {
    it('caches the error and leaves downstream pending', async () => {
      const manager = createManager();
      const error = new Error('denied');
      const open = vi.fn(() => {
        throw error;
      });
      const observe = vi.fn((stream: never) => stream);
      const first = acquire(pipe([open, collect([observe, observe])]));
      const second = acquire(pipe([open]));

      await expect(computed(manager, first)).rejects.toSatisfy(
        (failure: AggregateError) => {
          expect(failure.errors).toEqual([error]);
          return true;
        },
      );
      await expect(computed(manager, second)).rejects.toBeInstanceOf(
        AggregateError,
      );

      expect(open).toHaveBeenCalledTimes(1);
      expect(observe).not.toHaveBeenCalled();
      expect(inspect(first, first.nodes[0])).toEqual({
        step: 'failed',
        input: undefined,
        error,
      });
      expect(inspect(first, first.nodes[1])).toEqual({
        step: 'pending',
      });
    });

    it('caches what a collecting function throws', async () => {
      const manager = createManager();
      const error = new Error('denied');
      const fail = vi.fn((): never => {
        throw error;
      });
      const plan = collect([() => 1], fail);
      const first = acquire(plan);
      const second = acquire(plan);

      await expect(computed(manager, first)).rejects.toBeInstanceOf(
        AggregateError,
      );
      await expect(computed(manager, second)).rejects.toBeInstanceOf(
        AggregateError,
      );

      expect(fail).toHaveBeenCalledOnce();
      expect(inspect(first, first.output)).toEqual({
        step: 'failed',
        input: undefined,
        error,
      });
    });

    it('reports every independent failure', async () => {
      const manager = createManager();
      const left = () => Promise.reject(new Error('left'));
      const right = () => Promise.reject(new Error('right'));
      const handle = acquire(collect([left, right]));

      await expect(computed(manager, handle)).rejects.toSatisfy(
        (failure: AggregateError) => {
          expect(failure.errors.map((error: Error) => error.message)).toEqual([
            'left',
            'right',
          ]);
          return true;
        },
      );
    });
  });

  describe('release', () => {
    it('disposes resources once the last handle lets go', async () => {
      const manager = createManager();
      const dispose = vi.fn();
      const open = () => resource('stream', dispose);
      const first = acquire(pipe([open]));
      const second = acquire(pipe([open]));

      await Promise.all([computed(manager, first), computed(manager, second)]);
      await release(manager, first);
      expect(dispose).not.toHaveBeenCalled();

      await release(manager, second);
      expect(dispose).toHaveBeenCalledTimes(1);
    });

    it('disposes what a collecting function returns before its branches', async () => {
      const manager = createManager();
      const order: string[] = [];
      const open = () =>
        resource('stream', () => {
          order.push('stream');
        });
      const observe = (stream: string) =>
        resource(stream.length, () => {
          order.push('observer');
        });
      const first = acquire(collect([open], observe));
      const second = acquire(collect([open], observe));

      await computed(manager, first);
      await computed(manager, second);
      await release(manager, first);
      await release(manager, second);

      // Separate plans, so separate entries. See the TODO on `collect`.
      expect(order).toEqual(['observer', 'observer', 'stream']);
      expect(manager.cache.entries.task.size).toBe(0);
    });

    it('disposes reactive outputs, cleanup or not', async () => {
      const manager = createManager();
      const dispose = vi.fn();
      const observe = () => reactive(() => true, dispose);
      const bare = () => reactive(() => true);
      const handle = acquire(collect([observe, bare]));

      await computed(manager, handle);
      await release(manager, handle);

      expect(dispose).toHaveBeenCalledOnce();
    });

    it('tears down downstream before upstream', async () => {
      const manager = createManager();
      const order: string[] = [];
      const downstreamGate = Promise.withResolvers<void>();
      const open = () =>
        resource('stream', () => {
          order.push('stream');
        });
      const observe = (stream: string) =>
        resource(stream.length, async () => {
          order.push('observer:start');
          await downstreamGate.promise;
          order.push('observer:end');
        });
      const handle = acquire(pipe([open, observe]));

      await computed(manager, handle);
      const releasing = release(manager, handle);
      await settle();

      expect(order).toEqual(['observer:start']);

      downstreamGate.resolve();
      await releasing;

      expect(order).toEqual(['observer:start', 'observer:end', 'stream']);
    });

    it('tears down a synchronous plan before returning', () => {
      const manager = createManager();
      const dispose = vi.fn();
      const handle = acquire(pipe([() => resource('stream', dispose)]));
      compute(manager, handle);

      void release(manager, handle);

      expect(dispose).toHaveBeenCalledOnce();
      expect(manager.cache.entries.task.size).toBe(0);
    });

    it('restarts a released synchronous plan right away', () => {
      const manager = createManager();
      const open = vi.fn(() => resource('stream', () => {}));
      const first = acquire(pipe([open]));
      compute(manager, first);
      void release(manager, first);

      const result = compute(manager, acquire(pipe([open])));

      expect(result.type).toBe('sync');
      expect(open).toHaveBeenCalledTimes(2);
    });

    it('recomputes after a full release', async () => {
      const manager = createManager();
      const open = vi.fn(() => resource('stream', () => {}));
      const first = acquire(pipe([open]));
      await computed(manager, first);
      await release(manager, first);

      const second = acquire(pipe([open]));
      await computed(manager, second);

      expect(open).toHaveBeenCalledTimes(2);
    });

    it('waits for a retiring key before starting its next life', async () => {
      const manager = createManager();
      const order: string[] = [];
      const disposeGate = Promise.withResolvers<void>();
      const open = vi.fn(() => {
        order.push('open');
        return resource('stream', async () => {
          order.push('dispose:start');
          await disposeGate.promise;
          order.push('dispose:end');
        });
      });

      const first = acquire(pipe([open]));
      await computed(manager, first);
      const releasing = release(manager, first);
      await settle();
      expect(order).toEqual(['open', 'dispose:start']);

      const second = acquire(pipe([open]));
      const computing = computed(manager, second);
      await settle();

      expect(order).toEqual(['open', 'dispose:start']);

      disposeGate.resolve();
      await Promise.all([releasing, computing]);

      expect(order).toEqual(['open', 'dispose:start', 'dispose:end', 'open']);
      expect(output(second)).toEqual('stream');
    });

    it('lets in-flight work settle before disposing it', async () => {
      const manager = createManager();
      const gate = Promise.withResolvers<string>();
      const dispose = vi.fn();
      const open = () => gate.promise.then((value) => resource(value, dispose));
      const handle = acquire(pipe([open]));

      const computing = computed(manager, handle);
      await settle();
      const releasing = release(manager, handle);
      await settle();

      expect(dispose).not.toHaveBeenCalled();

      gate.resolve('stream');
      await releasing;
      await expect(computing).rejects.toBeInstanceOf(AbandonedError);

      expect(dispose).toHaveBeenCalledTimes(1);
    });

    it('skips what in-flight work would have fed', async () => {
      const manager = createManager();
      const gate = Promise.withResolvers<number>();
      const next = vi.fn((value: number) => value);
      const handle = acquire(pipe([() => gate.promise, next]));

      const computing = computed(manager, handle);
      const releasing = release(manager, handle);
      gate.resolve(1);
      await releasing;

      await expect(computing).rejects.toBeInstanceOf(AbandonedError);
      expect(next).not.toHaveBeenCalled();
      expect(manager.cache.entries.task.size).toBe(0);
    });

    it('reports failures that land before the abandonment does', async () => {
      const manager = createManager();
      const gate = Promise.withResolvers<number>();
      const failure = new Error('nope');
      const handle = acquire(pipe([() => gate.promise]));

      const computing = computed(manager, handle);
      const releasing = release(manager, handle);
      gate.reject(failure);
      await releasing;

      await expect(computing).rejects.toMatchObject({ errors: [failure] });
    });

    it('releases a failed plan and resets its nodes', async () => {
      const manager = createManager();
      const dispose = vi.fn();
      const stream = resource('stream', dispose);
      const open = () => stream;
      const observe = () => {
        throw new Error('observer');
      };
      const handle = acquire(pipe([open, observe]));

      await expect(computed(manager, handle)).rejects.toBeInstanceOf(
        AggregateError,
      );
      expect(inspect(handle, handle.nodes[1])).toEqual({
        step: 'failed',
        input: stream,
        error: new Error('observer'),
      });

      await release(manager, handle);

      expect(dispose).toHaveBeenCalledTimes(1);
      expect(inspect(handle, handle.nodes[1])).toEqual({ step: 'pending' });
    });

    it('does nothing for a handle that never computed', async () => {
      const manager = createManager();
      const open = vi.fn(() => 1);
      const handle = acquire(pipe([open]));

      await release(manager, handle);

      expect(open).not.toHaveBeenCalled();
    });

    it('runs every cleanup, then reports the ones that threw', async () => {
      const manager = createManager();
      const upstream = vi.fn();
      const open = () => resource('stream', upstream);
      const observe = (stream: string) =>
        resource(stream, () => {
          throw new Error('observer');
        });
      const handle = acquire(pipe([open, observe]));

      await computed(manager, handle);

      await expect(release(manager, handle)).rejects.toSatisfy(
        (failure: AggregateError) => {
          expect(failure.errors.map((error: Error) => error.message)).toEqual([
            'observer',
          ]);
          return true;
        },
      );
      expect(upstream).toHaveBeenCalledTimes(1);
    });
  });
});
