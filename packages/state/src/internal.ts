/** Initializer held by a `StoreRef`. Invoked once by {@link createStore}. */
export const INIT: unique symbol = Symbol();

/** The registry's internal store map. Hidden so consumers can't peek. */
export const ENTRIES: unique symbol = Symbol();

/** Opaque handle produced by `defineStore`. Identity is the object itself. */
export interface StoreRef<T> {
  readonly [INIT]: () => T;
}

/** A registry. Holds the materialized mutable state of every store it owns. */
export interface Registry {
  readonly [ENTRIES]: Map<StoreRef<object>, object>;
}
