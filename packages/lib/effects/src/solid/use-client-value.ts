import { createEffect, createSignal, on, onCleanup } from 'solid-js';
import { chain, now, rescue } from '../eventual';
import type { Plan } from '../plan';
import { useController, useMounted } from './context';
import {
  acquire,
  reduce,
  useThrowToBoundary,
  type Reduce,
} from './plan-resource';

/**
 * A client-only plan's output, read without suspending. Call it for the
 * value: the initial one until the plan resolves.
 */
export interface ClientValue<Value> {
  (): Value;

  /**
   * Whether the plan has resolved. Reactive. False through pre-render and
   * hydration, so both render the same thing.
   */
  readonly ready: boolean;
}

/** Options for {@link useClientValue}. */
export interface ClientValueOptions<Initial> {
  /**
   * Read until the plan resolves, on the server and the client alike, so
   * it must render the same in both. Defaults to `undefined`.
   */
  readonly initial?: Initial;
}

// Where the value stands. Objects, so an output of `undefined` still
// counts as ready, and a function isn't taken for an updater.
type Progress<Initial> =
  | { state: 'waiting'; value: Initial | undefined }
  | { state: 'ready'; output: unknown };

/**
 * Read a plan's output as a value, holding the plan for the component's
 * lifetime. Nothing runs until the component tree mounts, so the value
 * reads `initial` through pre-render and hydration, then computes on
 * mount. It never suspends: gate on `ready` instead. The plan is released
 * on cleanup, abandoning whatever it hadn't finished. Failures reach the
 * nearest `ErrorBoundary`, whether in computing or in cleanup, and
 * whether or not anything reads the value, so it holds a plan run only
 * for its lifetime just as well.
 *
 * Reads through the output's kind, like `useValue`. Options are
 * read once.
 */
export const useClientValue = <Output, Initial = undefined>(
  plan: Plan<void, Output>,
  options?: ClientValueOptions<Initial>,
): ClientValue<Reduce<Output> | Initial> => {
  const controller = useController();
  const throwToBoundary = useThrowToBoundary();
  const [handle, release] = acquire(plan);
  onCleanup(release);

  const [progress, setProgress] = createSignal<Progress<Initial>>({
    state: 'waiting',
    value: options?.initial,
  });

  // Untracked: tasks may read signals as they compute, and those belong
  // to the output, not to when it starts.
  createEffect(
    on(useMounted(), (mounted) => {
      if (!mounted) return;

      // Settles in place when the output is already here, so a `sync`
      // plan is ready before anything reads it. Unmounting abandons the
      // rest, which nobody's left to hear about. Without an error
      // boundary, the rethrow surfaces as an unhandled rejection.
      rescue(
        () =>
          chain(controller.compute(handle), (output) =>
            now(setProgress({ state: 'ready', output })),
          ),
        throwToBoundary,
      );
    }),
  );

  const read = () => {
    const current = progress();
    return current.state === 'ready' ? reduce(current.output) : current.value;
  };

  // eslint-disable-next-line solid/reactivity -- Decorated, not read.
  Object.defineProperty(read, 'ready', {
    get: () => progress().state === 'ready',
  });

  // The graph is untyped at runtime; the plan's signature vouches.
  return read as ClientValue<Reduce<Output> | Initial>;
};
