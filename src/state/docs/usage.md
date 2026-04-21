# State Management

- Single entry point: `#state`.
- Stores hold state. Actions mutate it. Effects wrap impure work and dispatch actions at lifecycle boundaries.
- Naming convention: a store named `timerStore` is referred to as `timer` inside action handlers.

## Stores

- `defineStore(init)`: Returns a `StoreRef<T>` — an opaque handle, no state yet.
- `createStore(storeRef)`: Materializes the store and returns a `DeepReadonly<T>` view for reads.
- Bootstrap a feature at module load: `export const timer = createStore(timerStore)`.

## Actions

- `defineAction([timerStore, sessionStore], (timer, session, input) => { ... })`: Binds one or more stores to a synchronous handler.
- Handler drafts are writable; writes batch into one reactive flush.
- `input` is always present at the call site — pass `undefined` when the action takes none.

## Effects

- `defineEffect(fn, { onStart?, onSuccess?, onFailure? })`: Wraps a side-effecting callback with lifecycle actions.
- `onStart` fires with the effect's input before the callback. `onSuccess` fires with the resolved value. `onFailure` fires with the caught error.
- Callback returns `Output | Promise<Output>`. Dispatch returns `void` (sync) or `Promise<void>` (async).

## Capabilities and Bindings

- Capabilities are low-level side-effect functions (e.g. `startRecording`, `captureTrack`). They know nothing about stores.
- Bindings layer `defineAction` and `defineEffect` on top, wrapping capabilities with the state transitions that surround them.
- `ref()` only appears in bindings; capabilities never know about refs.

## Hooks

- `useStore(storeRef)`: Returns the readonly state.
- `useAction(action)`: Returns a callable that dispatches the action.
- `useEffect(effect)`: Returns a callable that runs the effect.

## Refs

- `ref(value)`: Wraps a host object (media stream, recorder, etc.) in an opaque `Ref<T>` with a `.current` property.
- The ref is opaque to reactivity — fields underneath are not tracked.
- Swap by reassigning: `state.recorder = ref(next)`.

## Testing

- Every test builds its own registry via `bindRegistry(createRegistry())`.
- The bound object exposes the full registry-scoped API: `createStore`, `destroyStore`, `useStore`, `useAction`, `useEffect`, `invoke`, `perform`.
- Materialize required stores with `bound.createStore(storeRef)`, then drive state through the hooks.
