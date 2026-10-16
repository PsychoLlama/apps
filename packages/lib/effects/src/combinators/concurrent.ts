import {
  defineFlow,
  toBuild,
  type Flow,
  type FlowNode,
  type InputsOf,
  type OutputsOf,
  type StepAccepting,
  type Steps,
} from '../flow';

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
 * Run branches side by side over the same inputs. Outputs concatenate into
 * one tuple, so the next step sees every branch's result positionally.
 */
export const concurrent = <const S extends Steps>(
  branches: Branches<S>,
): Flow<InputsOf<S[0]>, ConcatOutputs<S>> =>
  defineFlow((inputs) => {
    const nodes: FlowNode[] = [];
    const outputs: FlowNode[] = [];

    for (const branch of branches as Steps) {
      const graph = toBuild(branch)(inputs);
      nodes.push(...graph.nodes);
      outputs.push(...graph.outputs);
    }

    return { nodes, outputs };
  });
