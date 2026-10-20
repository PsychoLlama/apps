import {
  definePlan,
  toBuild,
  type Plan,
  type PlanNode,
  type InputsOf,
  type ModeOfSteps,
  type OutputsOf,
  type StepAccepting,
  type Steps,
} from '../plan';
import type { YieldAll } from '../task';

type LastOf<Tuple extends readonly unknown[]> = Tuple extends readonly [
  ...unknown[],
  infer Last,
]
  ? Last
  : never;

/**
 * The input tuple each pipeline step receives, position by position: the
 * first step's own parameters, then what each previous step yields.
 */
type PipelineInputs<
  S extends readonly unknown[],
  Inputs extends readonly unknown[],
> = S extends readonly [infer Head, ...infer Rest]
  ? [Inputs, ...PipelineInputs<Rest, YieldAll<OutputsOf<Head>>>]
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
): Plan<InputsOf<S[0]>, OutputsOf<LastOf<S>>, ModeOfSteps<S>> =>
  definePlan((input) => {
    const [first, ...rest] = steps as Steps;
    const head = toBuild(first)(input);
    const nodes: PlanNode[] = [...head.nodes];
    let output = head.output;

    for (const step of rest) {
      const graph = toBuild(step)(output);
      nodes.push(...graph.nodes);
      output = graph.output;
    }

    return { nodes, output };
  });
