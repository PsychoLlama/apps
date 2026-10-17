import {
  defineFlow,
  toBuild,
  type Flow,
  type InputsOf,
  type Steps,
} from '../flow';
import { concurrent, type Branches, type ConcatOutputs } from './concurrent';
import { pipe } from './pipe';

// One shared identity so every `collect` joins through the same task.
const gather = (...values: unknown[]) => values;

/**
 * Like {@link concurrent}, but the branch outputs land in a single array
 * instead of spreading. Use it when the next step wants one value, or to
 * nest fan-outs without flattening.
 */
export const collect = <const S extends Steps>(
  branches: Branches<S>,
): Flow<InputsOf<S[0]>, [ConcatOutputs<S>]> =>
  defineFlow(toBuild(pipe([concurrent(branches), gather])));
