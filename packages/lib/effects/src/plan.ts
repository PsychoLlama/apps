import type { Task } from './task';

/** Marks a plan and carries its graph builder. */
export const PLAN: unique symbol = Symbol('plan');

/** Phantom slot pinning a plan's input and output tuples. */
declare const SIGNATURE: unique symbol;

/**
 * A computation graph from an input tuple to an output tuple. Tasks and
 * plans compose freely; a plan with `Inputs = []` is complete and can be
 * acquired. `Outputs` are raw: `resource`, `reactive`, and `collect`
 * wrappers stay visible, so bindings can tell the kinds apart.
 *
 * `Inputs` is contravariant and `Outputs` covariant, so `Plan<never>` is
 * the top of all plans: every concrete plan is assignable to it.
 */
export interface Plan<
  in Inputs extends readonly unknown[] = readonly unknown[],
  out Outputs extends readonly unknown[] = readonly unknown[],
> {
  readonly [PLAN]: Build;
  readonly [SIGNATURE]?: (...inputs: Inputs) => Outputs;
}

/**
 * Runs a task over its upstream's output tuple, spread as arguments. A
 * node without one is a root and gets no arguments.
 */
export interface TaskNode {
  readonly kind: 'task';
  readonly task: Task;
  readonly input?: PlanNode;
}

/**
 * Concatenates its branches' output tuples. Built by `concurrent` and
 * `collect`: the join is cached by that plan and the input its branches
 * share.
 */
export interface JoinNode {
  readonly kind: 'join';
  readonly plan: Plan<never>;
  readonly input?: PlanNode;
  readonly branches: readonly PlanNode[];

  /** Box the concatenated tuple as one value, as `collect` does. */
  readonly collect: boolean;
}

/**
 * One position in a built graph. Every node produces an output tuple: a
 * task's holds its one value, and a join's holds its branches' end to end.
 */
export type PlanNode = TaskNode | JoinNode;

/**
 * A fully-wired computation graph. `nodes` lists every node in
 * topological order; `output` is the node whose tuple is the plan's
 * output.
 */
export interface Graph {
  readonly nodes: readonly PlanNode[];
  readonly output: PlanNode;
}

/**
 * Wires a plan against a concrete upstream node, whose output tuple is
 * the plan's input. Plans stay abstract until composed, so a sub-plan's
 * input is only known once it's placed.
 */
export type Build = (input?: PlanNode) => Graph;

/** Anything that can sit in a plan: a task or another plan. */
export type Step = Task | Plan<never>;

/** A non-empty list of steps. */
export type Steps = readonly [Step, ...Step[]];

/** A task or plan accepting `Inputs`. */
export type StepAccepting<Inputs extends readonly unknown[]> =
  Task<Inputs> | Plan<Inputs>;

/** The input tuple a step accepts. */
export type InputsOf<S> =
  S extends Plan<infer Inputs>
    ? Inputs
    : S extends (...inputs: infer Inputs) => unknown
      ? Inputs
      : never;

/**
 * The raw output tuple a step produces, wrappers included. A task's is a
 * 1-tuple of what it returns, settled. Downstream tasks receive its
 * `YieldAll`.
 */
export type OutputsOf<S> =
  S extends Plan<never, infer Outputs>
    ? Outputs
    : S extends (...inputs: never) => infer Returned
      ? [Awaited<Returned>]
      : never;

/** The builder for any step. A task becomes a single node. */
export const toBuild = (step: Step): Build =>
  typeof step === 'function'
    ? (input) => {
        const node: PlanNode = { kind: 'task', task: step, input };
        return { nodes: [node], output: node };
      }
    : step[PLAN];

/**
 * Wrap a builder as a plan. Returns the bare builder slot rather than a
 * typed `Plan`: combinators declare the real `Inputs`/`Outputs` on their
 * own signatures, and leaving the phantom unset is what lets one value
 * satisfy any of them.
 */
export const definePlan = (build: Build): Pick<Plan, typeof PLAN> => ({
  [PLAN]: build,
});
