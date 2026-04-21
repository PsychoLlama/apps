# State Management

- Import from `#state`.
- Stores are opaque handles materialized in a registry. Actions mutate state. Effects wrap impure work and dispatch actions.

## Stores

- `defineStore(init)` returns a `StoreRef<T>`. No state is created until `createStore` runs.
- `createStore(registry, ref)` materializes the store in the registry and returns a `DeepReadonly<T>` view.
- `destroyStore(registry, ref)` tears it down. Double-create or destroy-missing throws.
- Module-level `const state = createStore(GLOBAL_REGISTRY, storeRef)` is the conventional bootstrap.

## Actions

- `defineAction([StoreA, StoreB], (a, b, input) => { ... })` binds one or more stores to a synchronous handler.
- Handler drafts are writable; all writes batch into one reactive flush.
- The input argument is always required at the call site — pass `undefined` when the action takes no input.

## Effects

- `defineEffect(fn, { onStart?, onSuccess?, onFailure? })` wraps a side-effecting callback with lifecycle actions.
- `onStart` runs before the callback with the effect's input. `onSuccess` runs after with the resolved value. `onFailure` runs on thrown/rejected errors.
- Without `onFailure`, sync throws bubble and async rejections reject the returned promise.
- Callback returns `Output | Promise<Output>`. `perform` returns `void` for sync effects and `Promise<void>` for async.

## Registry

- `createRegistry()` creates an isolated registry. Tests should build one per case.
- `GLOBAL_REGISTRY` is the singleton used by app code.

## Hooks

- `bindRegistry(registry)` returns `{ useStore, useAction, useEffect }` bound to that registry.
- Module-level `useStore`, `useAction`, `useEffect` exports are bound to `GLOBAL_REGISTRY`.
- `useStore(ref)` returns the readonly state. `useAction(action)` and `useEffect(effect)` return callables that dispatch against the bound registry.

## Raw dispatch

- `invoke(registry, action, input)` and `perform(registry, effect, input)` are the underlying primitives the hooks wrap.

## Refs

- `ref(value)` wraps a host object (media streams, recorders) in an opaque `Ref<T>` with a `.current` property.
- `createMutable` leaves class instances alone, so refs bypass proxy descent.
- Refs are immutable. Swap by reassigning: `state.recorder = ref(next)`.
- No automatic release. Clean up the held value explicitly before dropping the ref.

## Testing

- Per-test registry via `createRegistry()`. Materialize required stores, bind the registry, drive actions and effects through the hooks.
