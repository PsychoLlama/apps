import { createResource, type Resource } from 'solid-js';
import type { Plan } from '../plan';
import { useMounted } from './context';
import {
  forwardResource,
  holdPlan,
  reduce,
  type Reduce,
} from './plan-resource';

/**
 * Read a plan's output as a Solid resource, holding the plan for the
 * component's lifetime. Nothing runs until the component tree mounts, so
 * the resource reads unresolved through pre-render and hydration, then
 * computes on mount. It suspends under `Suspense` like any other
 * resource. The plan is released on cleanup. Failures reach the nearest
 * `ErrorBoundary`, whether in computing or in cleanup.
 *
 * Reads through the output's kind: a resource reads as its value, and a
 * reactive output as its current state, tracked. A collected output reads
 * as a fresh array of its reduced items.
 *
 * Takes a plan with one output. Join several with `collect`.
 */
export const useClientResource = <Output>(
  plan: Plan<[], [Output]>,
): Resource<Reduce<Output>> => {
  const [output] = createResource(useMounted(), holdPlan(plan));

  return forwardResource(output, () => reduce(output()));
};
