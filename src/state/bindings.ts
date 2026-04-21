import { invoke, type Action } from './action';
import { perform, type Effect, type PerformReturn } from './effect';
import { createRegistry, GLOBAL_REGISTRY, type Registry } from './registry';
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
  readonly useEffect: <S extends readonly StoreRef<object>[], I, O>(
    effect: Effect<S, I, O>,
  ) => (...args: CallArgs<I>) => PerformReturn<O>;
  readonly invoke: <S extends readonly StoreRef<object>[], I>(
    action: Action<S, I>,
    ...args: CallArgs<I>
  ) => void;
  readonly perform: <S extends readonly StoreRef<object>[], I, O>(
    effect: Effect<S, I, O>,
    ...args: CallArgs<I>
  ) => PerformReturn<O>;
}

/**
 * Bind a registry and return the full registry-scoped API. Tests build one
 * per case via {@link createTestBindings}; app code uses the module-level
 * exports bound to the global registry.
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
    useEffect<S extends readonly StoreRef<object>[], I, O>(
      effect: Effect<S, I, O>,
    ) {
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
    perform<S extends readonly StoreRef<object>[], I, O>(
      effect: Effect<S, I, O>,
      ...args: CallArgs<I>
    ): PerformReturn<O> {
      return perform(registry, effect, (args as [I?])[0] as I);
    },
  };
}

/**
 * Build bindings against a fresh isolated registry. One call per test
 * keeps state from leaking across cases and removes the
 * `bindRegistry(createRegistry())` boilerplate.
 */
export function createTestBindings(): RegistryBindings {
  return bindRegistry(createRegistry());
}

/** Helpers bound to the global registry. */
export const { createStore, destroyStore, useStore, useAction, useEffect } =
  bindRegistry(GLOBAL_REGISTRY);
