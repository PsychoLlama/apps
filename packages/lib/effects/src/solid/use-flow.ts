import { createResource, onCleanup, onMount, type Resource } from 'solid-js';
import { assert } from '@lib/assert';
import type { Controller } from '../controller/controller';
import type { Flow, FlowNode } from '../flow';
import type { Entry, Handle } from '../manager';
import { useController } from './context';

/** One Solid resource per output of a flow. */
export type FlowOutputs<Outputs extends readonly unknown[]> = {
  readonly [Index in keyof Outputs]: Resource<Outputs[Index]>;
};

/** The entry's output once it settles; throws its error if it failed. */
const outcome = async (entry: Entry): Promise<unknown> => {
  await entry.settled;
  const state = entry.state();
  assert(state.step !== 'computing', 'Entry settled while still computing.');

  if (state.step === 'failed') throw state.error;
  return state.value;
};

/**
 * A node as a Solid resource. The node's binding is the resource's source:
 * unbound reads as unresolved, a fresh binding fetches, and a rebind after
 * a source change refreshes while `latest` keeps the previous value.
 */
const toResource = (
  controller: Controller,
  handle: Handle,
  node: FlowNode,
): Resource<unknown> => {
  const [resource] = createResource(controller.bound(handle, node), outcome);
  return resource;
};

/**
 * Hold a flow for the component's lifetime. The graph is built during
 * setup, so outputs read as unresolved on the server and on the first
 * client render; it computes on mount and releases on cleanup. Outputs
 * are Solid resources, so they suspend under `Suspense` and throw to an
 * `ErrorBoundary` like any other.
 */
export const useFlow = <Outputs extends readonly unknown[]>(
  flow: Flow<[], Outputs>,
): FlowOutputs<Outputs> => {
  const controller = useController();
  const handle = controller.acquire(flow);

  onMount(() => {
    // Every failure is already a node state; the rejection only repeats them.
    void controller.compute(handle).catch(() => {});
  });

  onCleanup(() => {
    // A cleanup that throws has no component left to tell, so the
    // rejection goes unhandled on purpose: loud, as a bug should be.
    void controller.release(handle);
  });

  const outputs: readonly Resource<unknown>[] = handle.outputs.map((node) =>
    toResource(controller, handle, node),
  );

  // The graph is untyped at runtime; the flow's signature vouches.
  return outputs as FlowOutputs<Outputs>;
};
