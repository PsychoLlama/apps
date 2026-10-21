import type { Accessor } from 'solid-js';
import type { Mode, ModeOf } from '../mode';

/** Marks a wrapped output. Its value names the kind. */
const BRAND: unique symbol = Symbol('output');

/** Phantom slot pinning the mode of a wrapper's cleanup. */
declare const DISPOSE_MODE: unique symbol;

/** Releases whatever a resource holds. May be async. */
export type Dispose = () => void | PromiseLike<unknown>;

/**
 * A task output paired with its cleanup. Downstream tasks receive the bare
 * `value`; the runtime keeps `dispose` and runs it when the node is
 * released. `M` is the cleanup's {@link Mode}.
 */
export interface Resource<T, out M extends Mode = Mode> {
  readonly [BRAND]: 'resource';
  readonly [DISPOSE_MODE]?: M;
  readonly value: T;
  readonly dispose: Dispose;
}

/**
 * A task output that changes over time, paired with an optional cleanup.
 * Downstream tasks receive the bare accessor; the runtime keeps `dispose`
 * and runs it when the node is released. `M` is the cleanup's
 * {@link Mode}.
 */
export interface Reactive<T, out M extends Mode = Mode> {
  readonly [BRAND]: 'reactive';
  readonly [DISPOSE_MODE]?: M;
  readonly value: Accessor<T>;
  readonly dispose?: Dispose;
}

/** Any wrapped output, discriminated by its brand. */
export type Wrapped = Resource<unknown> | Reactive<unknown>;

/**
 * What a downstream task receives from an output: promises settled and
 * wrappers removed. Plans carry raw outputs; this applies where one step
 * feeds the next.
 */
export type Yield<Output> = Unwrap<Awaited<Output>>;

/**
 * The mode of an output's cleanup: `async` if it's a wrapper whose
 * `dispose` may return a promise.
 */
export type DisposeModeOf<Output> =
  Output extends Resource<unknown, infer M>
    ? M
    : Output extends Reactive<unknown, infer M>
      ? M
      : 'sync';

type Unwrap<Value> =
  Value extends Resource<infer Inner>
    ? Inner
    : Value extends Reactive<infer Inner>
      ? Accessor<Inner>
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
export const resource = <T, Disposed>(
  value: T,
  dispose: () => Disposed,
): Resource<T, ModeOf<Disposed>> => ({
  [BRAND]: 'resource',
  value,
  // Typed loosely so its result can pin the mode. The runtime awaits it.
  dispose: dispose as Dispose,
});

/**
 * Wrap state that changes on its own (a track's mute flag, a connection's
 * status) for Solid bindings to read reactively. Downstream tasks get the
 * accessor but run once; reading it there is a snapshot, not a
 * subscription.
 */
export const reactive = <T, Disposed = void>(
  value: Accessor<T>,
  dispose?: () => Disposed,
): Reactive<T, ModeOf<Disposed>> => ({
  [BRAND]: 'reactive',
  value,
  // As in `resource`.
  dispose: dispose as Dispose | undefined,
});
