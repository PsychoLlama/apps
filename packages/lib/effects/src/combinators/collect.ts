import type { Combine } from '../mode';
import type {
  InputsOf,
  ModeOfStep,
  ModeOfSteps,
  OutputsOf,
  Plan,
  Step,
  Steps,
} from '../plan';
import type { Collected, Task, YieldAll } from '../task';
import { defineJoin, type Branches, type ConcatOutputs } from './concurrent';

/** What `fn` receives: every branch's yields, in order. */
type Joined<S extends Steps> = Extract<
  YieldAll<ConcatOutputs<S>>,
  readonly unknown[]
>;

interface Collect {
  /**
   * Run branches side by side over the same inputs and hand their yields
   * to `fn`, spread in order. Its result is the plan's one output, cached
   * like a task's: it runs once for as long as the branches' outputs
   * live, and a `resource` it returns is disposed with them.
   */
  <const S extends Steps, Output>(
    branches: Branches<S>,
    fn: (...values: Joined<S>) => Output,
  ): Plan<
    InputsOf<S[0]>,
    OutputsOf<() => Output>,
    Combine<ModeOfSteps<S> | ModeOfStep<() => Output>>
  >;

  /**
   * Like {@link concurrent}, but the branch outputs land in a single array
   * instead of spreading. Use it when the next step wants one value, or to
   * nest fan-outs without flattening. The array keeps its identity for as
   * long as the branches' outputs do.
   */
  <const S extends Steps>(
    branches: Branches<S>,
  ): Plan<InputsOf<S[0]>, [Collected<ConcatOutputs<S>>], ModeOfSteps<S>>;
}

// TODO: Two `collect` calls with the same branches and `fn` are separate
// plans, so they cache separately and `fn` runs once for each. Sharing
// them needs a key beyond the plan's identity, e.g. interning plans by
// `fn` and branches as they're defined. Solve it before much depends on
// the duplication.
export const collect: Collect = (branches: readonly Step[], fn?: Task) =>
  defineJoin(branches, fn === undefined, fn);
