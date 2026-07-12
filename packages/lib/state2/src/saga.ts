import { abortError, isAbortError } from './abort';
import {
  SCOPE,
  type AnyCapability,
  type AnyFact,
  type AnySpaceRef,
  type ScopeRef,
} from './internal';
import type { Snapshot } from './space';

const COMMIT: unique symbol = Symbol();
const CALL: unique symbol = Symbol();
const READ: unique symbol = Symbol();
const ALL: unique symbol = Symbol();
const ATOMIC: unique symbol = Symbol();
const SPAWN: unique symbol = Symbol();

/** A side-effect function. Receives the governing `AbortSignal` first. */
export type Capability<Args extends unknown[], Return> = (
  signal: AbortSignal,
  ...args: Args
) => Return;

/**
 * One step of a saga: an inert value interpreted by the driver. Sagas
 * cannot touch stores — publishing facts and reading snapshots both go
 * through instructions, which is what makes them observable and
 * simulable.
 */
export type Instruction =
  | readonly [tag: typeof COMMIT, facts: readonly AnyFact[]]
  | readonly [tag: typeof CALL, fn: AnyCapability, args: readonly unknown[]]
  | readonly [tag: typeof READ, ref: AnySpaceRef]
  | readonly [tag: typeof ALL, children: readonly SagaGen[]]
  | readonly [tag: typeof ATOMIC, children: readonly SagaGen[]]
  | readonly [tag: typeof SPAWN, child: SagaGen];

/** The generator shape every saga body produces. */
export type SagaGen<Return = unknown> = AsyncGenerator<
  Instruction,
  Return,
  unknown
>;

/** A saga invocation: inert until driven by `run`, `simulate`, or `yield*`. */
export interface SagaInvocation<Return = unknown> extends AsyncGenerator<
  Instruction,
  Return,
  unknown
> {
  readonly [SCOPE]: ScopeRef;
}

/** A defined saga: calling it produces an invocation bound to its scope. */
export type Saga<Args extends unknown[], Return> = (
  ...args: Args
) => SagaInvocation<Return>;

/**
 * Define a saga — a process owned by a scope. The body is an async
 * generator whose only output vocabulary is instructions: `commit`,
 * `call`, `read`, `all`, `atomic`, `spawn`, or `yield*` into another
 * saga. Calling the returned function produces an inert invocation.
 */
export const defineSaga = <Args extends unknown[], Return>(
  scope: ScopeRef,
  body: (...args: Args) => AsyncGenerator<Instruction, Return, unknown>,
): Saga<Args, Return> => {
  return (...args) => Object.assign(body(...args), { [SCOPE]: scope });
};

/** Publish facts as one transition: N facts, one reactive flush. */
export const commit = (...facts: [AnyFact, ...AnyFact[]]): Instruction => [
  COMMIT,
  facts,
];

/**
 * Run a capability. The governing `AbortSignal` is injected as its first
 * argument, so cancellation is never forgotten. Visible to devtools and
 * `simulate`, unlike a bare `await`.
 */
export const call = function* <Args extends unknown[], Return>(
  fn: Capability<Args, Return>,
  ...args: Args
): Generator<Instruction, Awaited<Return>, unknown> {
  return (yield [
    CALL,
    fn as unknown as AnyCapability,
    args,
  ]) as Awaited<Return>;
};

/** Snapshot a store, cell, or formula. Untracked; stubbed in `simulate`. */
export const read = function* <Ref extends AnySpaceRef>(
  ref: Ref,
): Generator<Instruction, Snapshot<Ref>, unknown> {
  return (yield [READ, ref]) as Snapshot<Ref>;
};

type ReturnsOf<Children extends readonly SagaGen[]> = {
  -readonly [K in keyof Children]: Children[K] extends SagaGen<infer Return>
    ? Return
    : never;
};

/**
 * Run child sagas concurrently. Their commits pass through as they
 * happen. Resolves with the children's return values, in order.
 */
export const all = function* <
  const Children extends readonly [SagaGen, ...SagaGen[]],
>(...children: Children): Generator<Instruction, ReturnsOf<Children>, unknown> {
  return (yield [ALL, children]) as ReturnsOf<Children>;
};

/**
 * Run child sagas concurrently, holding their commits. When all settle,
 * every held fact lands in a single commit — one observable transition.
 * If any child fails, siblings are aborted and held facts are discarded:
 * all or nothing.
 */
export const atomic = function* <
  const Children extends readonly [SagaGen, ...SagaGen[]],
>(...children: Children): Generator<Instruction, ReturnsOf<Children>, unknown> {
  return (yield [ATOMIC, children]) as ReturnsOf<Children>;
};

/**
 * Start a detached child owned by the same scope. It outlives this saga
 * and dies with the scope. Its commits are never fused into an enclosing
 * `atomic`. Failures escape loudly rather than silently.
 */
export const spawn = function* (
  child: SagaGen,
): Generator<Instruction, void, unknown> {
  yield [SPAWN, child];
};

/**
 * Internal: how a driver serves instructions. `run` and `simulate` each
 * supply their own context.
 */
export interface DriveContext {
  readonly signal: AbortSignal;
  readonly sink: (facts: readonly AnyFact[]) => void;
  readonly call: (
    signal: AbortSignal,
    fn: AnyCapability,
    args: readonly unknown[],
  ) => unknown;
  readonly read: (ref: AnySpaceRef) => unknown;
  readonly spawn: (child: SagaGen) => void;
}

/**
 * Internal: drive a saga to completion, interpreting each instruction.
 * Aborting the context's signal closes the generator at the next resume
 * point (running `finally` blocks and disposing `for await` iterators)
 * and rejects with the abort reason. Instruction failures are thrown
 * back into the saga so it can recover; unhandled ones reject.
 */
export const drive = async <Return>(
  gen: SagaGen<Return>,
  context: DriveContext,
): Promise<Return> => {
  let step = await gen.next();

  while (!step.done) {
    if (context.signal.aborted) {
      await gen.return(undefined as never);
      throw reasonOf(context.signal);
    }

    let response: unknown;
    let threw = false;
    let failure: unknown;

    try {
      response = await execute(step.value, context);
    } catch (error) {
      threw = true;
      failure = error;
    }

    if (context.signal.aborted) {
      await gen.return(undefined as never);
      throw reasonOf(context.signal);
    }

    step = threw ? await gen.throw(failure) : await gen.next(response);
  }

  return step.value;
};

const reasonOf = (signal: AbortSignal): Error =>
  signal.reason instanceof Error ? signal.reason : abortError();

const execute = (instruction: Instruction, context: DriveContext): unknown => {
  switch (instruction[0]) {
    case COMMIT: {
      context.sink(instruction[1]);
      return undefined;
    }

    case CALL: {
      const [, fn, args] = instruction;
      return context.call(context.signal, fn, args);
    }

    case READ: {
      return context.read(instruction[1]);
    }

    case ALL: {
      return runBlock(instruction[1], context, false);
    }

    case ATOMIC: {
      return runBlock(instruction[1], context, true);
    }

    case SPAWN: {
      context.spawn(instruction[1]);
      return undefined;
    }
  }
};

const runBlock = async (
  children: readonly SagaGen[],
  context: DriveContext,
  fused: boolean,
): Promise<unknown[]> => {
  const controller = new AbortController();
  const propagate = () =>
    controller.abort(
      context.signal.reason instanceof Error
        ? context.signal.reason
        : abortError(),
    );

  if (context.signal.aborted) propagate();
  context.signal.addEventListener('abort', propagate, { once: true });

  const held: AnyFact[] = [];
  const scoped: DriveContext = {
    ...context,
    signal: controller.signal,
    sink: fused ? (facts) => held.push(...facts) : context.sink,
  };

  try {
    const settled = await Promise.allSettled(
      children.map((child) =>
        drive(child, scoped).catch((error: unknown) => {
          // First failure cancels the remaining siblings.
          controller.abort(abortError());
          throw error;
        }),
      ),
    );

    const rejections = settled.filter((entry) => entry.status === 'rejected');

    if (rejections.length > 0) {
      // Prefer the original failure over the AbortErrors it caused in
      // siblings. Held facts are discarded: all or nothing.
      const failure =
        rejections.find((entry) => !isAbortError(entry.reason)) ??
        rejections[0];
      throw failure.reason;
    }

    if (fused && held.length > 0) context.sink(held);

    return settled.map(
      (entry) => (entry as PromiseFulfilledResult<unknown>).value,
    );
  } finally {
    context.signal.removeEventListener('abort', propagate);
  }
};
