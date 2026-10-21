import {
  definePlan,
  toBuild,
  type Plan,
  type PlanNode,
  type InputOf,
  type ModeOfSteps,
  type OutputOf,
  type StepAccepting,
  type Steps,
} from '../plan';
import type { Yield } from '../task';

type LastOf<Tuple extends readonly unknown[]> = Tuple extends readonly [
  ...unknown[],
  infer Last,
]
  ? Last
  : never;

/**
 * The input each pipeline step receives, position by position: the first
 * step's own input, then what each previous step yields.
 */
type PipelineInputs<S extends readonly unknown[], Input> = S extends readonly [
  infer Head,
  ...infer Rest,
]
  ? [Input, ...PipelineInputs<Rest, Yield<OutputOf<Head>>>]
  : [];

type InputAt<S extends Steps, Index> = PipelineInputs<S, InputOf<S[0]>>[Index &
  keyof PipelineInputs<S, InputOf<S[0]>>];

// A mapped type over the step tuple rather than a bare type parameter:
// TypeScript infers `S` element by element through the mapping, so a step
// that doesn't fit reports against its own position. Inline arrows still
// need annotated parameters — contextual typing across positions would
// take one type parameter per position (overloads), and that isn't worth
// it.

/** Steps where each one accepts the previous step's output. */
type Pipeline<S extends Steps> = {
  readonly [Index in keyof S]: S[Index] & StepAccepting<InputAt<S, Index>>;
};

/** Chain steps in sequence. Each step receives what the previous yields. */
export const pipe = <const S extends Steps>(
  steps: Pipeline<S>,
): Plan<InputOf<S[0]>, OutputOf<LastOf<S>>, ModeOfSteps<S>> =>
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
