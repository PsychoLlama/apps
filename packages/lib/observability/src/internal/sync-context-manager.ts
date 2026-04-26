import {
  ROOT_CONTEXT,
  type Context,
  type ContextManager,
} from '@opentelemetry/api';

/**
 * A minimal synchronous {@link ContextManager}. Stack-based: `with(ctx, fn)`
 * sets the active context, runs `fn` synchronously, then restores the
 * previous context.
 *
 * Async work that crosses `await` boundaries does NOT inherit context —
 * pass spans explicitly when that matters. For full async propagation,
 * swap for `sdk-trace-web`'s context manager (or async-hooks on Node).
 */
export const createSyncContextManager = (): ContextManager => {
  let active: Context = ROOT_CONTEXT;

  const manager: ContextManager = {
    active: () => active,
    with(context, fn, thisArg, ...args) {
      const previous = active;
      active = context;
      try {
        return fn.call(thisArg as ThisParameterType<typeof fn>, ...args);
      } finally {
        active = previous;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- sync-only manager doesn't bind context to thenables
    bind<T>(_context: Context, target: T): T {
      return target;
    },
    enable() {
      return manager;
    },
    disable() {
      active = ROOT_CONTEXT;
      return manager;
    },
  };

  return manager;
};
