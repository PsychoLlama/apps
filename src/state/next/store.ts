import {
  createStore as solidCreateStore,
  type SetStoreFunction,
} from 'solid-js/store';
import { ENTRIES, INIT, type Registry, type StoreRef } from './internal';

export type { StoreRef };

/**
 * Recursively marks every property of `T` as `readonly`. Functions pass
 * through untouched; arrays become `ReadonlyArray<DeepReadonly<U>>`.
 */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/** Define a store as an opaque handle. No state is created until `createStore`. */
export function defineStore<T extends object>(init: () => T): StoreRef<T> {
  return { [INIT]: init };
}

/** Materialize a store in a registry. Returns a readonly view. */
export function createStore<T extends object>(
  registry: Registry,
  ref: StoreRef<T>,
): DeepReadonly<T> {
  const entries = registry[ENTRIES];
  const key = ref as StoreRef<object>;
  if (entries.has(key)) {
    throw new Error('Store already created in this registry');
  }
  const [state, setState] = solidCreateStore<T>(ref[INIT]());
  entries.set(key, setState as unknown as SetStoreFunction<object>);
  return state as DeepReadonly<T>;
}

/** Tear down a store in a registry. Throws if not created. */
export function destroyStore<T extends object>(
  registry: Registry,
  ref: StoreRef<T>,
): void {
  if (!registry[ENTRIES].delete(ref as StoreRef<object>)) {
    throw new Error('Store not created in this registry');
  }
}

/** Internal: resolve a ref's setter. Throws if not created. */
export function getSetter<T extends object>(
  registry: Registry,
  ref: StoreRef<T>,
): SetStoreFunction<T> {
  const setter = registry[ENTRIES].get(ref as StoreRef<object>);
  if (!setter) {
    throw new Error('Store not created in this registry');
  }
  return setter as unknown as SetStoreFunction<T>;
}
