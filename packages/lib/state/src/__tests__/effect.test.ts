import { createEffect, createRoot } from 'solid-js';
import { defineAction } from '../action';
import { createTestBindings } from '../bindings';
import { defineEffect } from '../effect';
import { defineStore } from '../store';

interface Session {
  status: 'idle' | 'pending' | 'ready' | 'failed';
  value: number;
  error: string | null;
}

const sessionStore = defineStore<Session>(() => ({
  status: 'idle',
  value: 0,
  error: null,
}));

// No input parameter — defineAction's default `Input = unknown` lets this
// assign to any effect's `onStart` slot via contravariance of the phantom
// `(value: Input) => void`.
const markPending = defineAction([sessionStore], (session) => {
  session.status = 'pending';
  session.error = null;
});

const markReady = defineAction([sessionStore], (session, value: number) => {
  session.status = 'ready';
  session.value = value;
});

const markFailed = defineAction([sessionStore], (session, error: Error) => {
  session.status = 'failed';
  session.error = error.message;
});

const bootstrap = () => {
  const bindings = createTestBindings();
  const session = bindings.createStore(sessionStore);
  return { ...bindings, session };
};

describe('defineEffect / useEffect', () => {
  it('calls onStart before running the effect', () => {
    const { useEffect, session } = bootstrap();
    const fn = vi.fn((value: number) => value * 2);

    const effect = defineEffect([], fn, { onStart: markPending });

    useEffect(effect)(21);
    expect(fn).toHaveBeenCalledWith(21);
    expect(session.status).toBe('pending');
  });

  it('runs onSuccess with the resolved value on sync effects', () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect([], (value: number) => value + 1, {
      onSuccess: markReady,
    });

    useEffect(effect)(4);
    expect(session.status).toBe('ready');
    expect(session.value).toBe(5);
  });

  it('runs onSuccess with the resolved value on async effects', async () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect(
      [],
      (value: number): Promise<number> => Promise.resolve(value * 10),
      { onSuccess: markReady },
    );

    await useEffect(effect)(3);
    expect(session.status).toBe('ready');
    expect(session.value).toBe(30);
  });

  it('routes sync throws to onFailure', () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect<readonly [], number, number>(
      [],
      () => {
        throw new Error('nope');
      },
      { onFailure: markFailed },
    );

    useEffect(effect)(0);
    expect(session.status).toBe('failed');
    expect(session.error).toBe('nope');
  });

  it('routes async rejections to onFailure', async () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect<readonly [], number, Promise<number>>(
      [],
      () => Promise.reject(new Error('async fail')),
      { onFailure: markFailed },
    );

    await useEffect(effect)(0);
    expect(session.status).toBe('failed');
    expect(session.error).toBe('async fail');
  });

  it('wraps non-Error throws into Error before dispatching onFailure', () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect<readonly [], number, number>(
      [],
      () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- Exercising the non-Error code path.
        throw 'plain string';
      },
      { onFailure: markFailed },
    );

    useEffect(effect)(0);
    expect(session.status).toBe('failed');
    expect(session.error).toBe('plain string');
  });

  it('re-throws sync errors when onFailure is absent', () => {
    const { useEffect } = bootstrap();
    const effect = defineEffect<readonly [], number, number>([], () => {
      throw new Error('boom');
    });

    expect(() => useEffect(effect)(0)).toThrow(/boom/);
  });

  it('rejects the returned promise when async errors have no onFailure', async () => {
    const { useEffect } = bootstrap();
    const effect = defineEffect<readonly [], number, Promise<number>>([], () =>
      Promise.reject(new Error('async boom')),
    );

    await expect(useEffect(effect)(0)).rejects.toThrow(/async boom/);
  });

  it('returns void for sync effects and Promise<void> for async effects', async () => {
    const { useEffect } = bootstrap();
    const syncEffect = defineEffect([], (value: number) => value);
    const asyncEffect = defineEffect(
      [],
      (value: number): Promise<number> => Promise.resolve(value),
    );

    const syncResult: void = useEffect(syncEffect)(1);
    expect(syncResult).toBeUndefined();

    const asyncResult: Promise<void> = useEffect(asyncEffect)(1);
    expect(asyncResult).toBeInstanceOf(Promise);
    await expect(asyncResult).resolves.toBeUndefined();
  });

  it('skips missing lifecycle handlers without error', async () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect(
      [],
      (value: number): Promise<number> => Promise.resolve(value),
    );

    await useEffect(effect)(7);
    expect(session.status).toBe('idle');
  });

  it('bubbles errors from onStart itself (programmer error, not effect failure)', () => {
    const { useEffect } = createTestBindings();
    const effect = defineEffect([], (value: number) => value, {
      onStart: markPending,
    });

    // sessionStore was never created in this registry.
    expect(() => useEffect(effect)(1)).toThrow(/not created/i);
  });

  it('accepts inline defineAction in every lifecycle slot', () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect(
      [],
      (value: number): number => {
        if (value < 0) throw new Error('negative');
        return value + 1;
      },
      {
        onStart: defineAction([sessionStore], (session) => {
          session.status = 'pending';
        }),
        onSuccess: defineAction([sessionStore], (session, value: number) => {
          session.status = 'ready';
          session.value = value;
        }),
        onFailure: defineAction([sessionStore], (session, error: Error) => {
          session.status = 'failed';
          session.error = error.message;
        }),
      },
    );

    useEffect(effect)(4);
    expect(session.status).toBe('ready');
    expect(session.value).toBe(5);
  });

  it('passes readonly store views to the callback', () => {
    const { useEffect, session, useAction } = bootstrap();
    useAction(defineAction([sessionStore], (draft) => (draft.value = 42)))();

    const seen: number[] = [];
    const effect = defineEffect([sessionStore], (view) => {
      seen.push(view.value);
    });

    useEffect(effect)();
    expect(seen).toEqual([session.value]);
  });

  it('does not subscribe the calling reactive scope to fields the callback reads', async () => {
    // The capability runs synchronously inside `perform`. Reads from the
    // store views must not track in the caller — otherwise dispatching
    // an effect from a `createEffect` body re-subscribes the outer
    // effect to whatever the capability inspects, and the next write
    // retriggers it.
    const { useEffect, useAction, session } = bootstrap();
    const effect = defineEffect([sessionStore], (view) => {
      // Touch the store so a missing untrack would create a dep.
      void view.value;
    });
    let outerRuns = 0;
    const dispose = createRoot((dispose) => {
      createEffect(() => {
        outerRuns += 1;
        useEffect(effect)();
      });
      return dispose;
    });
    await Promise.resolve();
    const baseline = outerRuns;
    useAction(markReady)(99);
    await Promise.resolve();
    expect(outerRuns).toBe(baseline);
    expect(session.value).toBe(99);
    dispose();
  });
});
