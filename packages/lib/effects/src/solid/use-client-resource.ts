import {
  createResource,
  getOwner,
  onCleanup,
  runWithOwner,
  type Resource,
} from 'solid-js';
import { assert } from '@lib/assert';
import type { Flow } from '../flow';
import {
  isWrapped,
  yieldOf,
  type Collected,
  type Reactive,
  type Resource as Owned,
} from '../task';
import { useController, useMounted } from './context';

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

const reduce = (output: unknown): unknown => {
  if (isWrapped(output, 'reactive')) return output.value();
  if (isWrapped(output, 'collected')) return output.items.map(reduce);

  return yieldOf(output);
};

/**
 * Read a flow's output as a Solid resource, holding the flow for the
 * component's lifetime. Nothing runs until the component tree mounts, so
 * the resource reads unresolved through pre-render and hydration, then
 * computes on mount. It suspends under `Suspense` like any other
 * resource. The flow is released on cleanup. Failures reach the nearest
 * `ErrorBoundary`, whether in computing or in cleanup.
 *
 * Reads through the output's kind: a resource reads as its value, and a
 * reactive output as its current state, tracked. A collected output reads
 * as a fresh array of its reduced items.
 *
 * Takes a flow with one output. Join several with `collect`.
 */
export const useClientResource = <Output>(
  flow: Flow<[], [Output]>,
): Resource<Reduce<Output>> => {
  const owner = getOwner();
  const controller = useController();
  const handle = controller.acquire(flow);

  // Cleanup finishes after the component is disposed. A disposed owner
  // keeps its context, so failures still find the nearest error
  // boundary through it. Without one, they're rethrown as an unhandled
  // rejection.
  onCleanup(() => {
    controller.release(handle).catch((error: unknown) => {
      runWithOwner(owner, () => {
        throw error;
      });
    });
  });

  const [output] = createResource(useMounted(), async () => {
    await controller.compute(handle);

    const state = controller.inspect(handle, handle.output);
    assert(state.step === 'succeeded', 'Flow computed without an output.');

    return state.outputs[0];
  });

  // The resource holds the raw output; reading reduces it. Its status
  // fields are forwarded so this still reads as a resource.
  const read = () => reduce(output());
  Object.defineProperties(read, {
    state: { get: () => output.state },
    loading: { get: () => output.loading },
    error: { get: (): unknown => output.error },
    latest: { get: () => reduce(output.latest) },
  });

  // The graph is untyped at runtime; the flow's signature vouches.
  return read as Resource<Reduce<Output>>;
};
