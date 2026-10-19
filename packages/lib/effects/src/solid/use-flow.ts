import {
  createResource,
  getOwner,
  onCleanup,
  runWithOwner,
  type Resource,
} from 'solid-js';
import { assert } from '@lib/assert';
import type { Flow } from '../flow';
import { useController, useMounted } from './context';

/**
 * Hold a flow for the component's lifetime and read its output as a Solid
 * resource. Nothing runs until the component tree mounts, so the resource
 * reads unresolved through pre-render and hydration, then computes on
 * mount. It suspends under `Suspense` like any other resource. The flow
 * is released on cleanup. Failures reach the nearest `ErrorBoundary`,
 * whether in computing or in cleanup.
 *
 * Takes a flow with one output. Join several with `collect`.
 */
export const useFlow = <Output>(flow: Flow<[], [Output]>): Resource<Output> => {
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

    // The graph is untyped at runtime; the flow's signature vouches.
    return state.outputs[0] as Output;
  });

  return output;
};
