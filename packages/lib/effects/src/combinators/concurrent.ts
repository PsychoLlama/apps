import type { Task } from '../task';
import {
  definePlan,
  toBuild,
  type Plan,
  type PlanNode,
  type InputsOf,
  type ModeOfSteps,
  type OutputsOf,
  type Step,
  type StepAccepting,
  type Steps,
} from '../plan';

/** Every step's outputs, concatenated into one tuple. */
export type ConcatOutputs<S extends readonly unknown[]> = S extends readonly [
  infer Head,
  ...infer Rest,
]
  ? [...OutputsOf<Head>, ...ConcatOutputs<Rest>]
  : [];

// A mapped type over the step tuple for the same reason as `Pipeline`:
// each branch is checked and reported at its own position.

/** Steps that all accept the same inputs as the first one. */
export type Branches<S extends Steps> = {
  readonly [Index in keyof S]: S[Index] & StepAccepting<InputsOf<S[0]>>;
};

/**
 * A plan that runs the branches over its input and joins their tuples,
 * through `fn` if given. The plan keys every join it builds.
 */
export const defineJoin = (
  branches: readonly Step[],
  collect: boolean,
  fn?: Task,
) => {
  const plan = definePlan((input) => {
    const nodes: PlanNode[] = [];
    const outputs: PlanNode[] = [];

    for (const branch of branches) {
      const graph = toBuild(branch)(input);
      nodes.push(...graph.nodes);
      outputs.push(graph.output);
    }

    const join: PlanNode = {
      kind: 'join',
      plan,
      input,
      branches: outputs,
      collect,
      fn,
    };

    nodes.push(join);
    return { nodes, output: join };
  });

  return plan;
};

/**
 * Run branches side by side over the same inputs. Outputs concatenate into
 * one tuple, so the next step sees every branch's result positionally.
 */
export const concurrent = <const S extends Steps>(
  branches: Branches<S>,
): Plan<InputsOf<S[0]>, ConcatOutputs<S>, ModeOfSteps<S>> =>
  defineJoin(branches, false);
