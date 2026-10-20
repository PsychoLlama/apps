import { getOwner, onCleanup, runWithOwner, type Resource } from 'solid-js';
import { assert } from '@lib/assert';
import type { Flow } from '../flow';
import type { Handle } from '../manager';
import {
  isWrapped,
  yieldOf,
  type Collected,
  type Reactive,
  type Resource as Owned,
} from '../task';
import { useController } from './context';

/**
 * What a component reads from an output: wrappers removed, reactive state
 * read through, collected items reduced one by one.
 */
export type Reduce<Output> =
  Output extends Owned<infer Inner>
    ? Inner
    : Output extends Reactive<infer Inner>
      ? Inner
      : Output extends Collected<infer Items>
        ? { [Index in keyof Items]: Reduce<Items[Index]> }
        : Output;

/** Read an output the way {@link Reduce} types it. */
export const reduce = (output: unknown): unknown => {
  if (isWrapped(output, 'reactive')) return output.value();
  if (isWrapped(output, 'collected')) return output.items.map(reduce);

  return yieldOf(output);
};

/**
 * An error handler that rethrows under the current owner, so failures
 * that land later find its nearest error boundary, even once it's
 * disposed. Without one, the handler throws.
 */
export const useThrowToBoundary = () => {
  const owner = getOwner();

  return (error: unknown): void => {
    runWithOwner(owner, () => {
      throw error;
    });
  };
};

/**
 * Acquire a flow on the nearest controller. Release it once: failures
 * reach the current owner's error boundary, or else surface as an
 * unhandled rejection.
 */
export const acquire = (flow: Flow<[]>): [Handle, release: () => void] => {
  const controller = useController();
  const throwToBoundary = useThrowToBoundary();
  const handle = controller.acquire(flow);

  const release = () => {
    controller.release(handle).catch(throwToBoundary);
  };

  return [handle, release];
};

/**
 * Hold a flow for the owner's lifetime. Returns a fetcher that computes
 * it and resolves to its raw output.
 */
export const holdFlow = (flow: Flow<[], [unknown]>) => {
  const controller = useController();
  const [handle, release] = acquire(flow);

  // TODO: Server renders share the default controller, so cached state
  // carries from one render into the next, and nothing releases it:
  // cleanup doesn't reliably run on the server. Give each server render
  // its own controller.
  onCleanup(release);

  return async (): Promise<unknown> => {
    await controller.compute(handle);

    const state = controller.inspect(handle, handle.output);
    assert(state.step === 'succeeded', 'Flow computed without an output.');

    return state.outputs[0];
  };
};

/**
 * Present `read` as the resource it stands in for: status fields come
 * from `output`, and `latest` reduces like `read` does.
 */
export const forwardResource = <Value>(
  output: Resource<unknown>,
  read: () => unknown,
): Resource<Value> => {
  Object.defineProperties(read, {
    state: { get: () => output.state },
    loading: { get: () => output.loading },
    error: { get: (): unknown => output.error },
    latest: { get: () => reduce(output.latest) },
  });

  // The graph is untyped at runtime; the flow's signature vouches.
  return read as Resource<Value>;
};
