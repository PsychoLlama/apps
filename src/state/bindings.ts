import { invoke, type Action } from './action';
import { perform, type Effect, type PerformReturn } from './effect';
import { GLOBAL_REGISTRY, type Registry } from './registry';
import {
  createStore as createStoreInternal,
  destroyStore as destroyStoreInternal,
  getMutable,
  type DeepReadonly,
  type StoreRef,
} from './store';

/** Registry-scoped API returned by {@link bindRegistry}. */
export interface RegistryBindings {
  readonly createStore: <T extends object>(ref: StoreRef<T>) => DeepReadonly<T>;
  readonly destroyStore: <T extends object>(ref: StoreRef<T>) => void;
  readonly useStore: <T extends object>(ref: StoreRef<T>) => DeepReadonly<T>;
  readonly useAction: <S extends readonly StoreRef<object>[], I>(
    action: Action<S, I>,
  ) => (input: I) => void;
  readonly useEffect: <I, O>(
    effect: Effect<I, O>,
  ) => (input: I) => PerformReturn<O>;
  readonly invoke: <S extends readonly StoreRef<object>[], I>(
    action: Action<S, I>,
    input: I,
  ) => void;
  readonly perform: <I, O>(effect: Effect<I, O>, input: I) => PerformReturn<O>;
}

/**
 * Bind a registry and return the full registry-scoped API. Tests build one
 * per case; app code uses the module-level exports bound to the global
 * registry.
 */
export function bindRegistry(registry: Registry): RegistryBindings {
  return {
    createStore<T extends object>(ref: StoreRef<T>): DeepReadonly<T> {
      return createStoreInternal(registry, ref);
    },
    destroyStore<T extends object>(ref: StoreRef<T>): void {
      destroyStoreInternal(registry, ref);
    },
    useStore<T extends object>(ref: StoreRef<T>): DeepReadonly<T> {
      return getMutable(registry, ref) as DeepReadonly<T>;
    },
    useAction<S extends readonly StoreRef<object>[], I>(
      action: Action<S, I>,
    ): (input: I) => void {
      return (input) => {
        invoke(registry, action, input);
      };
    },
    useEffect<I, O>(effect: Effect<I, O>): (input: I) => PerformReturn<O> {
      return (input) => perform(registry, effect, input);
    },
    invoke<S extends readonly StoreRef<object>[], I>(
      action: Action<S, I>,
      input: I,
    ): void {
      invoke(registry, action, input);
    },
    perform<I, O>(effect: Effect<I, O>, input: I): PerformReturn<O> {
      return perform(registry, effect, input);
    },
  };
}

/** Helpers bound to the global registry. */
export const { createStore, destroyStore, useStore, useAction, useEffect } =
  bindRegistry(GLOBAL_REGISTRY);
