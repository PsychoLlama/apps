import { invoke, type Action } from './action';
import { perform, type Effect, type PerformReturn } from './effect';
import { GLOBAL_REGISTRY, type Registry } from './registry';
import { getMutable, type DeepReadonly, type StoreRef } from './store';

/** Registry-bound helpers returned by {@link bindRegistry}. */
export interface RegistryBindings {
  readonly useStore: <T extends object>(ref: StoreRef<T>) => DeepReadonly<T>;
  readonly useAction: <S extends readonly StoreRef<object>[], I>(
    action: Action<S, I>,
  ) => (input: I) => void;
  readonly useEffect: <I, O>(
    effect: Effect<I, O>,
  ) => (input: I) => PerformReturn<O>;
}

/**
 * Bind a registry and return ergonomic helpers for reading state,
 * invoking actions, and performing effects. Tests build one per case;
 * app code uses the module-level exports bound to {@link GLOBAL_REGISTRY}.
 */
export function bindRegistry(registry: Registry): RegistryBindings {
  return {
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
  };
}

/** Default helpers bound to the global registry. */
export const { useStore, useAction, useEffect } = bindRegistry(GLOBAL_REGISTRY);
