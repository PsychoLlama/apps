import type { Plan, InputsOf, Steps } from '../plan';
import type { Collected } from '../task';
import { defineJoin, type Branches, type ConcatOutputs } from './concurrent';

/**
 * Like {@link concurrent}, but the branch outputs land in a single array
 * instead of spreading. Use it when the next step wants one value, or to
 * nest fan-outs without flattening. The array keeps its identity for as
 * long as the branches' outputs do.
 */
export const collect = <const S extends Steps>(
  branches: Branches<S>,
): Plan<InputsOf<S[0]>, [Collected<ConcatOutputs<S>>]> =>
  defineJoin(branches, true);
