/** Discriminates definition kinds at runtime. */
export const KIND: unique symbol = Symbol();

/** The scope a store or cell belongs to. */
export const SCOPE: unique symbol = Symbol();

/** Initializer held by store and cell refs. Invoked on first touch. */
export const INIT: unique symbol = Symbol();

/** Teardown hook held by cell refs. Runs when the owning scope dies. */
export const DROP: unique symbol = Symbol();

/** Folds subscribed to a topic. */
export const SUBSCRIBERS: unique symbol = Symbol();

/** A formula's dependency list. */
export const DEPS: unique symbol = Symbol();

/** A formula's derivation function. */
export const COMPUTE: unique symbol = Symbol();

/** The runtime's live scope instances. */
export const SCOPES: unique symbol = Symbol();

/** Commit listeners (test ledgers, future devtools). */
export const OBSERVERS: unique symbol = Symbol();

/** Listeners for failures escaping detached (spawned) sagas. */
export const FAILURES: unique symbol = Symbol();

/** Capability stubs used by test runtimes. Keyed by the real function. */
export const STUBS: unique symbol = Symbol();

/** Opaque handle produced by `defineScope`. Identity is the object itself. */
export interface ScopeRef {
  readonly [KIND]: 'scope';
}

/** Opaque handle produced by `defineStore`. */
export interface StoreRef<T extends object> {
  readonly [KIND]: 'store';
  readonly [SCOPE]: ScopeRef;
  readonly [INIT]: () => T;
}

/**
 * Opaque handle produced by `defineCell`. The drop hook's parameter is
 * typed `never` so `CellRef<T>` stays covariant in `T`; the runtime
 * passes the held value.
 */
export interface CellRef<T> {
  readonly [KIND]: 'cell';
  readonly [SCOPE]: ScopeRef;
  readonly [INIT]: () => T;
  readonly [DROP]: ((value: never) => void) | undefined;
}

/**
 * Opaque handle produced by `defineFormula`. `COMPUTE`'s parameters are
 * typed `never` for the same covariance reason as `CellRef`.
 */
export interface FormulaRef<T> {
  readonly [KIND]: 'formula';
  readonly [DEPS]: readonly AnySpaceRef[];
  readonly [COMPUTE]: (...values: never[]) => T;
}

/** Any ref a fold may draft. */
export type AnyWritableRef = StoreRef<object> | CellRef<unknown>;

/** Any ref that resolves to a value. */
export type AnySpaceRef = AnyWritableRef | FormulaRef<unknown>;

/** Fact-constructor args: zero-arg when the topic carries no payload. */
export type PayloadArgs<Payload> = [Payload] extends [void]
  ? []
  : [payload: Payload];

/** A fact: `[topic, payload]`. Inert until committed. */
export type Fact<Payload = unknown> = readonly [
  topic: Topic<Payload>,
  payload: Payload,
];

/** Type-erased fact accepted by commit paths. */
export type AnyFact = readonly [
  topic: { readonly [SUBSCRIBERS]: readonly Fold[] },
  payload: unknown,
];

/** An event producer. Calling it wraps a payload into a fact. */
export interface Topic<Payload = void> {
  (...args: PayloadArgs<Payload>): Fact<Payload>;
  readonly [SUBSCRIBERS]: Fold[];
}

/**
 * A fold subscription: the refs to draft plus the pure handler. Handler
 * params are typed `never` at this erased layer; `defineFold` owns the
 * real signature.
 */
export type Fold = readonly [
  refs: readonly AnyWritableRef[],
  handler: (...args: never[]) => void,
];

/** A side-effect function: the governing `AbortSignal` first, then args. */
export type AnyCapability = (signal: AbortSignal, ...args: never[]) => unknown;

/** Materialized store or cell state living inside a scope instance. */
export type SpaceInstance =
  | { readonly kind: 'store'; readonly state: object }
  | { readonly kind: 'cell'; readonly box: { current: unknown } };

/** A live scope: refcounted anchors plus the space it owns. */
export interface ScopeInstance {
  anchors: number;
  readonly controller: AbortController;
  readonly spaces: Map<AnyWritableRef, SpaceInstance>;
}

/** A runtime holds every live scope. App code uses the implicit global. */
export interface Runtime {
  readonly [SCOPES]: Map<ScopeRef, ScopeInstance>;
  readonly [OBSERVERS]: Array<(facts: readonly AnyFact[]) => void>;
  readonly [FAILURES]: Array<(error: Error) => void>;
  readonly [STUBS]: Map<AnyCapability, AnyCapability>;
}
