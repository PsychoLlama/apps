import type { Accessor } from 'solid-js';

/** Marks a wrapped output. Its value names the kind. */
const BRAND: unique symbol = Symbol('output');

/** Releases whatever a resource holds. May be async. */
export type Dispose = () => void | PromiseLike<unknown>;

/**
 * A task output paired with its cleanup. Downstream tasks receive the bare
 * `value`; the runtime keeps `dispose` and runs it when the node is
 * released.
 */
export interface Resource<T> {
  readonly [BRAND]: 'resource';
  readonly value: T;
  readonly dispose: Dispose;
}

/**
 * A task output that changes over time, paired with an optional cleanup.
 * Downstream tasks receive the bare accessor; the runtime keeps `dispose`
 * and runs it when the node is released.
 */
export interface Reactive<T> {
  readonly [BRAND]: 'reactive';
  readonly value: Accessor<T>;
  readonly dispose?: Dispose;
}

/**
 * The output of `collect`: its branches' outputs as returned, wrappers
 * and all. Downstream tasks receive the unwrapped `value`. Built by the
 * runtime, never by tasks.
 */
export interface Collected<Items extends readonly unknown[]> {
  readonly [BRAND]: 'collected';
  readonly value: YieldAll<Items>;
  readonly items: Items;
  readonly dispose?: undefined;
}

/** Any wrapped output, discriminated by its brand. */
export type Wrapped =
  Resource<unknown> | Reactive<unknown> | Collected<readonly unknown[]>;

/**
 * What a downstream task receives from an output: promises settled and
 * wrappers removed. Plans carry raw outputs; this applies where one step
 * feeds the next.
 */
export type Yield<Output> = Unwrap<Awaited<Output>>;

/** `Yield` over every position of an output tuple. */
export type YieldAll<Outputs extends readonly unknown[]> = {
  [Index in keyof Outputs]: Yield<Outputs[Index]>;
};

type Unwrap<Value> =
  Value extends Resource<infer Inner>
    ? Inner
    : Value extends Reactive<infer Inner>
      ? Accessor<Inner>
      : Value extends Collected<infer Items>
        ? YieldAll<Items>
        : Value;

type Kind = Wrapped[typeof BRAND];

/** Whether an output is wrapped, and optionally of which kind. */
export const isWrapped = <K extends Kind = Kind>(
  output: unknown,
  kind?: K,
): output is Extract<Wrapped, { readonly [BRAND]: K }> =>
  typeof output === 'object' &&
  output !== null &&
  BRAND in output &&
  (kind === undefined || output[BRAND] === kind);

/** What downstream receives from an output, as `Yield` types it. */
export const yieldOf = (output: unknown): unknown =>
  isWrapped(output) ? output.value : output;

/** The cleanup an output carries, if any. */
export const disposeOf = (output: unknown): Dispose | undefined =>
  isWrapped(output) ? output.dispose : undefined;

/**
 * Wrap a long-lived value (a media stream, a socket, a subscription) with
 * the function that tears it down. Return it from a task; the graph owns
 * the lifetime from there.
 */
export const resource = <T>(value: T, dispose: Dispose): Resource<T> => ({
  [BRAND]: 'resource',
  value,
  dispose,
});

/**
 * Wrap state that changes on its own (a track's mute flag, a connection's
 * status) for Solid bindings to read reactively. Downstream tasks get the
 * accessor but run once; reading it there is a snapshot, not a
 * subscription.
 */
export const reactive = <T>(
  value: Accessor<T>,
  dispose?: Dispose,
): Reactive<T> => ({
  [BRAND]: 'reactive',
  value,
  dispose,
});

/** Box branch outputs, unwrapped once so `value` keeps one identity. */
export const collected = (
  items: readonly unknown[],
): Collected<readonly unknown[]> => ({
  [BRAND]: 'collected',
  value: items.map(yieldOf),
  items,
});
