import { createResource, onCleanup, type Resource } from 'solid-js';
import { assert } from '@lib/assert';
import type { Flow } from '../flow';
import { useController, useMounted } from './context';

/**
 * Hold a flow for the component's lifetime and read its output as a Solid
 * resource. Nothing runs until the component tree mounts, so the resource reads
 * unresolved through pre-render and hydration, then computes on mount.
 * Failures reject the resource, so they reach an `ErrorBoundary`, and it
 * suspends under `Suspense` like any other. The flow is released on
 * cleanup.
 *
 * Takes a flow with one output. Join several with `collect`.
 */
export const useFlow = <Output>(flow: Flow<[], [Output]>): Resource<Output> => {
  const controller = useController();
  const handle = controller.acquire(flow);

  onCleanup(() => {
    // The component is gone, so no error boundary will see a failed
    // cleanup. It surfaces only as an unhandled rejection: a console
    // error, and an `unhandledrejection` event for whatever listens.
    void controller.release(handle);
  });

  const [output] = createResource(useMounted(), async () => {
    await controller.compute(handle);

    const [node] = handle.outputs;
    const state = controller.inspect(handle, node);
    assert(state.step === 'succeeded', 'Flow computed without an output.');

    // The graph is untyped at runtime; the flow's signature vouches.
    return state.value as Output;
  });

  return output;
};
