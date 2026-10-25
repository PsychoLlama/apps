import { batch, createSignal, onCleanup } from 'solid-js';
import type { Plan } from '../plan';
import { yieldOf, type Yield } from '../task';
import { useController } from './context';
import { acquire, refCount, useThrowToBoundary } from './plan-resource';

type AnyFunction = (...args: never[]) => unknown;

/**
 * A function to call from event handlers, with reactive fields that
 * follow its calls.
 */
export interface Action<Args extends unknown[], Result> {
  (...args: Args): void;

  /** Whether any call is in flight. */
  readonly pending: boolean;

  /** What the most recent call to succeed returned. */
  readonly latest: Result | undefined;

  /** Why the most recent call to settle failed, if it did. */
  readonly error: unknown;
}

type ActionOf<Output> =
  Yield<Output> extends (...args: infer Args) => infer Result
    ? Action<Args, Awaited<Result>>
    : never;

/**
 * Call a plan's output as a function from event handlers. The plan
 * computes on the first call, so its dependencies resolve then. Once
 * computed, calls go straight through, synchronously, which keeps APIs
 * that need a user gesture working. The plan is held from render until
 * the component unmounts and every call has settled.
 *
 * Calls return nothing: read `pending`, `latest`, and `error` instead.
 * A failed call's error also reaches the nearest error boundary.
 *
 * Takes a plan whose output is the function, as a downstream task would
 * receive it.
 */
export const useAction = <
  Output extends (Yield<Output> extends AnyFunction ? unknown : never),
>(
  plan: Plan<void, Output>,
): ActionOf<Output> => {
  const controller = useController();
  const throwToBoundary = useThrowToBoundary();
  const [handle, release] = acquire(plan);
  const hold = refCount(release);
  onCleanup(hold());

  const run = async (...args: unknown[]) => {
    const done = hold();

    try {
      // Calls straight through when it's here, before any await.
      const computed = controller.compute(handle);
      const output =
        computed.type === 'sync' ? computed.value : await computed.value;

      // Untyped at runtime, as above.
      const call = yieldOf(output) as (...rest: unknown[]) => unknown;
      return await call(...args);
    } finally {
      done();
    }
  };

  const [calls, setCalls] = createSignal(0);
  const [latest, setLatest] = createSignal<unknown>();
  const [error, setError] = createSignal<unknown>();

  const action = (...args: unknown[]) => {
    setCalls((count) => count + 1);

    // Without an error boundary, the rethrow surfaces as an unhandled
    // rejection from here.
    void run(...args).then(
      (value) => {
        batch(() => {
          setCalls((count) => count - 1);
          setLatest(() => value);
          setError(undefined);
        });
      },
      (failure: unknown) => {
        batch(() => {
          setCalls((count) => count - 1);
          setError(() => failure);
        });

        throwToBoundary(failure);
      },
    );
  };

  Object.defineProperties(action, {
    pending: { get: () => calls() > 0 },
    latest: { get: latest },
    error: { get: error },
  });

  // The graph is untyped at runtime; the plan's signature vouches.
  return action as unknown as ActionOf<Output>;
};
