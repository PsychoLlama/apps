import { type Task, type Yield } from './task';

/** Marks a flow and carries its graph builder. */
export const FLOW: unique symbol = Symbol('flow');

/** Phantom slot pinning a flow's input and output tuples. */
declare const SIGNATURE: unique symbol;

/**
 * A computation graph from an input tuple to an output tuple. Tasks and
 * flows compose freely; a flow with `Inputs = []` is complete and can be
 * acquired.
 *
 * `Inputs` is contravariant and `Outputs` covariant, so `Flow<never>` is
 * the top of all flows: every concrete flow is assignable to it.
 */
export interface Flow<
  in Inputs extends readonly unknown[] = readonly unknown[],
  out Outputs extends readonly unknown[] = readonly unknown[],
> {
  readonly [FLOW]: Build;
  readonly [SIGNATURE]?: (...inputs: Inputs) => Outputs;
}

/**
 * Runs a task over its upstream's output tuple, spread as arguments. A
 * node without one is a root and gets no arguments.
 */
export interface TaskNode {
  readonly kind: 'task';
  readonly task: Task;
  readonly input?: FlowNode;
}

/**
 * Concatenates its branches' output tuples. Built by `concurrent`, whose
 * flow keys the join's cached work.
 */
export interface JoinNode {
  readonly kind: 'join';
  readonly flow: Flow<never>;
  readonly branches: readonly FlowNode[];
}

/**
 * One position in a built graph. Every node produces an output tuple: a
 * task's holds its one value, and a join's holds its branches' end to end.
 */
export type FlowNode = TaskNode | JoinNode;

/**
 * A fully-wired computation graph. `nodes` lists every node in
 * topological order; `output` is the node whose tuple is the flow's
 * output.
 */
export interface Graph {
  readonly nodes: readonly FlowNode[];
  readonly output: FlowNode;
}

/**
 * Wires a flow against a concrete upstream node, whose output tuple is
 * the flow's input. Flows stay abstract until composed, so a sub-flow's
 * input is only known once it's placed.
 */
export type Build = (input?: FlowNode) => Graph;

/** Anything that can sit in a flow: a task or another flow. */
export type Step = Task | Flow<never>;

/** A non-empty list of steps. */
export type Steps = readonly [Step, ...Step[]];

/** A task or flow accepting `Inputs`. */
export type StepAccepting<Inputs extends readonly unknown[]> =
  Task<Inputs> | Flow<Inputs>;

/** The input tuple a step accepts. */
export type InputsOf<S> =
  S extends Flow<infer Inputs>
    ? Inputs
    : S extends (...inputs: infer Inputs) => unknown
      ? Inputs
      : never;

/** The output tuple a step produces. A task yields a 1-tuple. */
export type OutputsOf<S> =
  S extends Flow<never, infer Outputs>
    ? Outputs
    : S extends (...inputs: never) => infer Returned
      ? [Yield<Returned>]
      : never;

/** The builder for any step. A task becomes a single node. */
export const toBuild = (step: Step): Build =>
  typeof step === 'function'
    ? (input) => {
        const node: FlowNode = { kind: 'task', task: step, input };
        return { nodes: [node], output: node };
      }
    : step[FLOW];

/**
 * Wrap a builder as a flow. Returns the bare builder slot rather than a
 * typed `Flow`: combinators declare the real `Inputs`/`Outputs` on their
 * own signatures, and leaving the phantom unset is what lets one value
 * satisfy any of them.
 */
export const defineFlow = (build: Build): Pick<Flow, typeof FLOW> => ({
  [FLOW]: build,
});
