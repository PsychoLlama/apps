import {
  definePlan,
  toBuild,
  type InputOf,
  type Join,
  type ModeOfStep,
  type ModeOfSteps,
  type OutputOf,
  type Plan,
  type PlanNode,
  type Step,
  type StepAccepting,
  type Steps,
} from '../plan';
import type { Yield } from '../task';

// A mapped type rather than recursion, so it stays transparent over
// generic tuples like `[Head, ...Rest]`.

/** What each branch yields, in order. */
type Joined<S extends readonly unknown[]> = {
  -readonly [Index in keyof S]: Yield<OutputOf<S[Index]>>;
};

// An array constraint rather than a mapped one like `Pipeline`'s, so it
// holds for generic tuples too: `[Head, ...Rest]` checks against it when
// `Rest` is only known by its own constraint.

/** Steps that all accept the same input as the first one. */
type Branches<S extends Steps> = S & readonly StepAccepting<InputOf<S[0]>>[];

// Phrased so that a known `sync` function leaves exactly the branches'
// mode, which a generic caller can then match by name.

/** The mode of a join through a function returning `Output`. */
type ModeOfJoin<S extends Steps, Output> =
  ModeOfStep<() => Output> extends 'sync' ? ModeOfSteps<S> : 'async';

interface Collect {
  /**
   * Run branches side by side over the same input and hand their yields
   * to `fn`, spread in order. Its result is the plan's one output, cached
   * like a task's: it runs once for as long as the branches' outputs
   * live, and a `resource` it returns is disposed with them.
   */
  <const S extends Steps, Output>(
    branches: Branches<S>,
    fn: (...values: Joined<S>) => Output,
  ): Plan<InputOf<S[0]>, Awaited<Output>, ModeOfJoin<S, Output>>;

  /**
   * Run branches side by side over the same input and land their yields
   * in a single array. The array keeps its identity for as long as the
   * branches' outputs do. Wrappers stay behind: a reactive branch lands
   * as its accessor, so return `reactive` from `fn` to read several
   * reactively.
   */
  <const S extends Steps>(
    branches: Branches<S>,
  ): Plan<InputOf<S[0]>, Joined<S>, ModeOfSteps<S>>;
}

// What a join without its own `fn` runs. One array per entry, so it keeps
// its identity while the branches live.
const array = (...values: readonly unknown[]) => values;

// TODO: Two `collect` calls with the same branches and `fn` are separate
// plans, so they cache separately and `fn` runs once for each. Sharing
// them needs a key beyond the plan's identity, e.g. interning plans by
// `fn` and branches as they're defined. Solve it before much depends on
// the duplication.
export const collect: Collect = (
  branches: readonly Step[],
  fn: Join = array,
) => {
  const plan = definePlan((input) => {
    const nodes: PlanNode[] = [];
    const outputs: PlanNode[] = [];

    for (const branch of branches) {
      const graph = toBuild(branch)(input);
      nodes.push(...graph.nodes);
      outputs.push(graph.output);
    }

    // The plan keys every join it builds.
    const join: PlanNode = { kind: 'join', plan, input, branches: outputs, fn };
    nodes.push(join);
    return { nodes, output: join };
  });

  return plan;
};
