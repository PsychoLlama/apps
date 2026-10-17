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

type LastOf<Tuple extends readonly unknown[]> = Tuple extends readonly [
  ...unknown[],
  infer Last,
]
  ? Last
  : never;

/**
 * The input tuple each pipeline step receives, position by position: the
 * first step's own parameters, then each previous step's outputs.
 */
type PipelineInputs<
  S extends readonly unknown[],
  Inputs extends readonly unknown[],
> = S extends readonly [infer Head, ...infer Rest]
  ? [Inputs, ...PipelineInputs<Rest, OutputsOf<Head>>]
  : [];

type InputsAt<S extends Steps, Index> = Extract<
  PipelineInputs<S, InputsOf<S[0]>>[Index &
    keyof PipelineInputs<S, InputsOf<S[0]>>],
  readonly unknown[]
>;

// A mapped type over the step tuple rather than a bare type parameter:
// TypeScript infers `S` element by element through the mapping, so a step
// that doesn't fit reports against its own position. Inline arrows still
// need annotated parameters — contextual typing across positions would
// take one type parameter per position (overloads), and that isn't worth
// it.

/** Steps where each one accepts the previous step's outputs. */
type Pipeline<S extends Steps> = {
  readonly [Index in keyof S]: S[Index] & StepAccepting<InputsAt<S, Index>>;
};

/**
 * Chain steps in sequence. Each step receives the previous step's output
 * tuple spread as positional arguments.
 */
export const pipe = <const S extends Steps>(
  steps: Pipeline<S>,
): Flow<InputsOf<S[0]>, OutputsOf<LastOf<S>>> =>
  defineFlow((inputs) => {
    const nodes: FlowNode[] = [];
    let outputs = inputs;

    for (const step of steps as Steps) {
      const graph = toBuild(step)(outputs);
      nodes.push(...graph.nodes);
      outputs = graph.outputs;
    }

    return { nodes, outputs };
  });
