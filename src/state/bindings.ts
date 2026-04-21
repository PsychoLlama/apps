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

/**
 * Empty when `I` is `unknown` (the default for no-input actions), otherwise
 * `[input: I]`. Lets `useAction(foo)()` work for no-input actions while
 * forcing `useAction(foo)(value)` for typed input.
 */
type CallArgs<I> = unknown extends I ? [] : [input: I];

/** Registry-scoped API returned by {@link bindRegistry}. */
export interface RegistryBindings {
  readonly createStore: <T extends object>(ref: StoreRef<T>) => DeepReadonly<T>;
  readonly destroyStore: <T extends object>(ref: StoreRef<T>) => void;
  readonly useStore: <T extends object>(ref: StoreRef<T>) => DeepReadonly<T>;
  readonly useAction: <S extends readonly StoreRef<object>[], I>(
    action: Action<S, I>,
  ) => (...args: CallArgs<I>) => void;
  readonly useEffect: <I, O>(
    effect: Effect<I, O>,
  ) => (...args: CallArgs<I>) => PerformReturn<O>;
  readonly invoke: <S extends readonly StoreRef<object>[], I>(
    action: Action<S, I>,
    ...args: CallArgs<I>
  ) => void;
  readonly perform: <I, O>(
    effect: Effect<I, O>,
    ...args: CallArgs<I>
  ) => PerformReturn<O>;
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
    useAction<S extends readonly StoreRef<object>[], I>(action: Action<S, I>) {
      return ((...args: [I?]) => {
        invoke(registry, action, args[0] as I);
      }) as (...args: CallArgs<I>) => void;
    },
    useEffect<I, O>(effect: Effect<I, O>) {
      return ((...args: [I?]) => perform(registry, effect, args[0] as I)) as (
        ...args: CallArgs<I>
      ) => PerformReturn<O>;
    },
    invoke<S extends readonly StoreRef<object>[], I>(
      action: Action<S, I>,
      ...args: CallArgs<I>
    ): void {
      invoke(registry, action, (args as [I?])[0] as I);
    },
    perform<I, O>(
      effect: Effect<I, O>,
      ...args: CallArgs<I>
    ): PerformReturn<O> {
      return perform(registry, effect, (args as [I?])[0] as I);
    },
  };
}

/** Helpers bound to the global registry. */
export const { createStore, destroyStore, useStore, useAction, useEffect } =
  bindRegistry(GLOBAL_REGISTRY);
