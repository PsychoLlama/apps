import { getOwner, runWithOwner } from 'solid-js';
import type { Mode } from '../mode';
import type { Plan } from '../plan';
import { AbandonedError, type Handle } from '../manager';
import {
  isWrapped,
  yieldOf,
  type Reactive,
  type Resource as Owned,
} from '../task';
import { useController } from './context';

/**
 * What a component reads from an output: wrappers removed, reactive state
 * read through.
 */
export type Reduce<Output> =
  Output extends Owned<infer Inner>
    ? Inner
    : Output extends Reactive<infer Inner>
      ? Inner
      : Output;

/** Read an output the way {@link Reduce} types it. */
export const reduce = (output: unknown): unknown =>
  isWrapped(output, 'reactive') ? output.value() : yieldOf(output);

/**
 * An error handler that rethrows under the current owner, so failures
 * that land later find its nearest error boundary, even once it's
 * disposed. Without one, the handler throws. Abandoned work isn't a
 * failure, so it's dropped.
 */
export const useThrowToBoundary = () => {
  const owner = getOwner();

  return (error: unknown): void => {
    if (error instanceof AbandonedError) return;

    runWithOwner(owner, () => {
      throw error;
    });
  };
};

/**
 * Acquire a plan on the nearest controller. Release it once: failures
 * reach the current owner's error boundary, or else surface as an
 * unhandled rejection.
 */
export const acquire = <Output, M extends Mode>(
  plan: Plan<void, Output, M>,
): [Handle<Output, M>, release: () => void] => {
  const controller = useController();
  const throwToBoundary = useThrowToBoundary();
  const handle = controller.acquire(plan);

  const release = () => {
    controller.release(handle).catch(throwToBoundary);
  };

  return [handle, release];
};
