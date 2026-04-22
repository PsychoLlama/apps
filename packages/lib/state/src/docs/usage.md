# State Management

- Single entry point: `@lib/state`.
- Stores hold state. Actions mutate it. Effects wrap impure work and dispatch actions at lifecycle boundaries.
- Naming convention: a store named `timerStore` is referred to as `timer` inside action handlers.

## Stores

- `defineStore(init)`: Returns a `StoreRef<T>` — an opaque handle, no state yet.
- `createStore(storeRef)`: Materializes the store and returns a `DeepReadonly<T>` view for reads.
- Bootstrap a feature at module load: `export const timer = createStore(timerStore)`.

## Actions

- `defineAction([timerStore, sessionStore], (timer, session, input) => { ... })`: Binds one or more stores to a synchronous handler.
- Handler drafts are writable; writes batch into one reactive flush.
- Omit the trailing `input` parameter when the handler doesn't need it — the call site becomes zero-arg.
- Typed-input actions require the input at the call site: `useAction(addN)(5)`.

## Effects

- `defineEffect([sessionStore], fn, { onStart?, onSuccess?, onFailure? })`: Wraps a side-effecting callback with lifecycle actions.
- The callback receives a readonly view for each declared store followed by the input. Pass `[]` when the callback reads no state.
- `onStart` fires with the effect's input before the callback. `onSuccess` fires with the resolved value. `onFailure` fires with the caught error.
- Lifecycle slots accept named actions or inline `defineAction(...)` calls.
- Callback returns `Output | Promise<Output>`. Dispatch returns `void` (sync) or `Promise<void>` (async).

## Capabilities and Bindings

- Capabilities are low-level side-effect functions (e.g. `startRecording`, `captureTrack`). They don't import the state module.
- Bindings pair capabilities with lifecycle actions via `defineEffect`. When an effect needs to read state, it declares the stores and the capability becomes the callback directly — no wrapper.
- `ref()` is reserved for values that must not participate in reactivity at all; most host objects (class instances) pass through `createMutable` unproxied without it.

## Hooks

- `useStore(storeRef)`: Returns the readonly state.
- `useAction(action)`: Returns a callable that dispatches the action.
- `useEffect(effect)`: Returns a callable that runs the effect.

## Refs

- `ref(value)`: Wraps a value in an opaque `Ref<T>` with a `.current` property.
- `DeepReadonly` short-circuits on `Ref`, so `state.handle.current` is typed as the held value.
- Swap by reassigning: `state.handle = ref(next)`.

## Testing

- `createTestBindings()`: Returns the full registry-scoped API backed by a fresh registry. One call per test keeps state isolated.
- Materialize required stores with `bindings.createStore(storeRef)`, then drive state through the hooks.
