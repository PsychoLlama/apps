import { createMutable } from 'solid-js/store';
import { ENTRIES, INIT, type Registry, type StoreRef } from './internal';
import type { Ref } from './ref';

export type { StoreRef };

/**
 * Recursively marks every property of `T` as `readonly`. Functions and
 * `Ref<T>` pass through untouched; arrays become
 * `ReadonlyArray<DeepReadonly<U>>`. Short-circuiting on `Ref` keeps
 * `.current` typed as the held value so consumers don't need to cast.
 */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Ref<unknown>
    ? T
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepReadonly<U>>
      : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T;

/** Define a store as an opaque handle. No state is created until `createStore`. */
export const defineStore = <T extends object>(init: () => T): StoreRef<T> => {
  return { [INIT]: init };
};

/** Materialize a store in a registry. Returns a readonly view. */
export const createStore = <T extends object>(
  registry: Registry,
  ref: StoreRef<T>,
): DeepReadonly<T> => {
  const entries = registry[ENTRIES];
  const key = ref as StoreRef<object>;
  if (entries.has(key)) {
    throw new Error('Store already created in this registry');
  }
  const state = createMutable<T>(ref[INIT]());
  entries.set(key, state);
  return state as DeepReadonly<T>;
};

/** Tear down a store in a registry. Throws if not created. */
export const destroyStore = <T extends object>(
  registry: Registry,
  ref: StoreRef<T>,
): void => {
  if (!registry[ENTRIES].delete(ref as StoreRef<object>)) {
    throw new Error('Store not created in this registry');
  }
};

/** Internal: resolve a ref's mutable state. Throws if not created. */
export const getMutable = <T extends object>(
  registry: Registry,
  ref: StoreRef<T>,
): T => {
  const state = registry[ENTRIES].get(ref as StoreRef<object>);
  if (!state) {
    throw new Error('Store not created in this registry');
  }
  return state as T;
};
