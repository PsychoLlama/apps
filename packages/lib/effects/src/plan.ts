import type { Combine, Mode, ModeOf } from './mode';
import type { DisposeModeOf, Task } from './task';

/** Marks a plan and carries its graph builder. */
export const PLAN: unique symbol = Symbol('plan');

/** Phantom slot pinning a plan's input and output. */
declare const SIGNATURE: unique symbol;

/** Phantom slot pinning a plan's mode. */
declare const MODE: unique symbol;

/**
 * A computation graph from one input to one output. Tasks and plans
 * compose freely; a plan with `Input = void` is complete and can be
 * acquired. `Output` is raw: `resource` and `reactive` wrappers stay
 * visible, so bindings can tell the kinds apart.
 *
 * `M` is the plan's {@link Mode}: `sync` when every task returns without
 * a promise and cleans up without one.
 *
 * `Input` is contravariant, `Output` and `M` covariant, so `Plan<never>`
 * (bare `Plan`) is the top of all plans: every concrete plan is
 * assignable to it.
 */
export interface Plan<
  in Input = never,
  out Output = unknown,
  out M extends Mode = Mode,
> {
  readonly [PLAN]: Build;
  readonly [SIGNATURE]?: (input: Input) => Output;
  readonly [MODE]?: M;
}

/**
 * Runs a task over its upstream's output. A node without one is a root
 * and gets no argument.
 */
export interface TaskNode {
  readonly kind: 'task';
  readonly task: Task;
  readonly input?: PlanNode;
}

/**
 * Runs `fn` over its branches' outputs. Built by `collect`: the join is
 * cached by that plan and the input its branches share.
 */
export interface JoinNode {
  readonly kind: 'join';
  readonly plan: Plan<never>;
  readonly input?: PlanNode;
  readonly branches: readonly PlanNode[];

  /**
   * Runs once over the branches' yields, spread as arguments. Its result
   * is the join's one output, as a task's would be.
   */
  readonly fn: Join;
}

/**
 * What a join runs over its branches' yields. `never` parameters make it
 * the top of all such functions, like bare `Task`.
 */
export type Join = (...yields: never) => unknown;

/** One position in a built graph. Every node produces one output. */
export type PlanNode = TaskNode | JoinNode;

/**
 * A fully-wired computation graph. `nodes` lists every node in
 * topological order; `output` is the node whose output is the plan's.
 */
export interface Graph {
  readonly nodes: readonly PlanNode[];
  readonly output: PlanNode;
}

/**
 * Wires a plan against a concrete upstream node, whose output is the
 * plan's input. Plans stay abstract until composed, so a sub-plan's input
 * is only known once it's placed.
 */
export type Build = (input?: PlanNode) => Graph;

/** Anything that can sit in a plan: a task or another plan. */
export type Step = Task | Plan<never>;

/** A non-empty list of steps. */
export type Steps = readonly [Step, ...Step[]];

/** A task or plan accepting `Input`. */
export type StepAccepting<Input> = Task<Input> | Plan<Input>;

// Every slot inferred at once. Matching `Plan<infer Input>` leaves the
// mode at `Mode`, and a generic one can't be checked against that until
// it's known, so a plan like `Plan<void, Output, M>` would stay deferred.
type PlanSlots<S> =
  S extends Plan<infer Input, infer Output, infer M>
    ? { input: Input; output: Output; mode: M }
    : never;

// Arity rather than a parameter tuple, so a generic parameter type, as in
// `(input: Input) => State`, still resolves.

/** The input a step accepts. A task without parameters accepts `void`. */
export type InputOf<S> = S extends () => unknown
  ? void
  : S extends (input: infer Input) => unknown
    ? Input
    : PlanSlots<S>['input'];

/**
 * The raw output a step produces, wrappers included. A task's is what it
 * returns, settled. Downstream tasks receive its `Yield`.
 */
export type OutputOf<S> = S extends (...inputs: never) => infer Returned
  ? Awaited<Returned>
  : PlanSlots<S>['output'];

/**
 * A step's mode. A task is `async` if it may return a promise, or a
 * wrapper whose cleanup may.
 */
export type ModeOfStep<S> = S extends (...inputs: never) => infer Returned
  ? Combine<ModeOf<Returned> | DisposeModeOf<Awaited<Returned>>>
  : PlanSlots<S>['mode'];

/** The mode of several steps together: `async` if any of them is. */
export type ModeOfSteps<S extends readonly unknown[]> = Combine<
  { [Index in keyof S]: ModeOfStep<S[Index]> }[number]
>;

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
 * typed `Plan`: combinators declare the real `Input`/`Output` on their
 * own signatures, and leaving the phantom unset is what lets one value
 * satisfy any of them.
 */
export const definePlan = (build: Build): Pick<Plan, typeof PLAN> => ({
  [PLAN]: build,
});
