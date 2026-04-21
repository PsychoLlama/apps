import { vi } from 'vitest';
import { defineAction } from '../action';
import { bindRegistry } from '../bindings';
import { defineEffect } from '../effect';
import { createRegistry } from '../registry';
import { createStore, defineStore } from '../store';

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

// Accepts `unknown` so the action works as `onStart` for effects with any
// input type. Function parameter contravariance: an action that accepts
// unknown assigns to one that expects a narrower input.
const markPending = defineAction([sessionStore], (session, input: unknown) => {
  void input;
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

function bootstrap() {
  const registry = createRegistry();
  const bound = bindRegistry(registry);
  createStore(registry, sessionStore);
  return { registry, ...bound, session: bound.useStore(sessionStore) };
}

describe('defineEffect / useEffect', () => {
  it('calls onStart before running the effect', () => {
    const { useEffect, session } = bootstrap();
    const fn = vi.fn((x: number) => x * 2);

    const effect = defineEffect(fn, { onStart: markPending });

    useEffect(effect)(21);
    expect(fn).toHaveBeenCalledWith(21);
    expect(session.status).toBe('pending');
  });

  it('runs onSuccess with the resolved value on sync effects', () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect((x: number) => x + 1, {
      onSuccess: markReady,
    });

    useEffect(effect)(4);
    expect(session.status).toBe('ready');
    expect(session.value).toBe(5);
  });

  it('runs onSuccess with the resolved value on async effects', async () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect(
      (x: number): Promise<number> => Promise.resolve(x * 10),
      { onSuccess: markReady },
    );

    await useEffect(effect)(3);
    expect(session.status).toBe('ready');
    expect(session.value).toBe(30);
  });

  it('routes sync throws to onFailure', () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect(
      (input: number): number => {
        void input;
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
    const effect = defineEffect(
      (input: number): Promise<number> => {
        void input;
        return Promise.reject(new Error('async fail'));
      },
      { onFailure: markFailed },
    );

    await useEffect(effect)(0);
    expect(session.status).toBe('failed');
    expect(session.error).toBe('async fail');
  });

  it('wraps non-Error throws into Error before dispatching onFailure', () => {
    const { useEffect, session } = bootstrap();
    const effect = defineEffect(
      (input: number): number => {
        void input;
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
    const effect = defineEffect((input: number): number => {
      void input;
      throw new Error('boom');
    });

    expect(() => useEffect(effect)(0)).toThrow(/boom/);
  });

  it('rejects the returned promise when async errors have no onFailure', async () => {
    const { useEffect } = bootstrap();
    const effect = defineEffect((input: number): Promise<number> => {
      void input;
      return Promise.reject(new Error('async boom'));
    });

    await expect(useEffect(effect)(0)).rejects.toThrow(/async boom/);
  });

  it('returns void for sync effects and Promise<void> for async effects', async () => {
    const { useEffect } = bootstrap();
    const syncEffect = defineEffect((x: number) => x);
    const asyncEffect = defineEffect(
      (x: number): Promise<number> => Promise.resolve(x),
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
      (x: number): Promise<number> => Promise.resolve(x),
    );

    await useEffect(effect)(7);
    expect(session.status).toBe('idle');
  });

  it('bubbles errors from onStart itself (programmer error, not effect failure)', () => {
    const registry = createRegistry();
    const { useEffect } = bindRegistry(registry);
    const effect = defineEffect((x: number) => x, { onStart: markPending });

    // sessionStore was never created in this registry.
    expect(() => useEffect(effect)(1)).toThrow(/not created/i);
  });
});
