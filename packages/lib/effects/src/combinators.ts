import {
  defineFlow,
  toBuild,
  type Flow,
  type FlowNode,
  type InputsOf,
  type OutputsOf,
  type StepAccepting,
  type Steps,
} from './flow';

type LastOf<Tuple extends readonly unknown[]> = Tuple extends readonly [
  ...unknown[],
  infer Last,
]
  ? Last
  : never;

/** Every step's outputs, concatenated into one tuple. */
type ConcatOutputs<S extends readonly unknown[]> = S extends readonly [
  infer Head,
  ...infer Rest,
]
  ? [...OutputsOf<Head>, ...ConcatOutputs<Rest>]
  : [];

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

// Parameters are mapped types over the step tuple rather than a bare type
// parameter: TypeScript infers `S` element by element through the mapping,
// so a step that doesn't fit reports against its own position. Inline
// arrows still need annotated parameters — contextual typing across
// positions would take one type parameter per position (overloads), and
// that isn't worth it.

/** Steps where each one accepts the previous step's outputs. */
type Pipeline<S extends Steps> = {
  readonly [Index in keyof S]: S[Index] & StepAccepting<InputsAt<S, Index>>;
};

/** Steps that all accept the same inputs as the first one. */
type Branches<S extends Steps> = {
  readonly [Index in keyof S]: S[Index] & StepAccepting<InputsOf<S[0]>>;
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
