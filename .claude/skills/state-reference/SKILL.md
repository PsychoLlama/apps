---
description: Reference docs for `@lib/state` — stores, actions, effects, refs, and registry-scoped hooks. Load when authoring or reviewing code that consumes `@lib/state`, picking an API, or wiring tests against an isolated registry.
---

# State Management

- Single entry point: `@lib/state`.
- Stores hold state. Actions mutate state. Effects wrap impure work and dispatch actions at lifecycle boundaries.
- Multi-store coordination happens inside a single action's store tuple — no pub/sub, no fan-out.
- Side effects belong in effects, never in actions or stores.

## Guidelines

- The app is statically generated (SolidStart `static` preset). State materializes at module load against a global registry, so initial render has no async gap.
- Consider whether a loading state is meaningful: data sourced from synchronous store reads is ready on first paint, while effect-driven work (network, media, async capabilities) needs explicit status fields.
- Naming convention: a store named `timerStore` is referred to as `timer` inside action and effect handlers.
- Every store-state interface and every field gets a JSDoc comment describing its role, not its type. Same for any types the state references (status unions, entity shapes, etc).

## Stores

- `defineStore<T>(init)`: Returns a `StoreRef<T>` — opaque handle, no state yet. Module-level constant.
- `createStore(storeRef)`: Materializes the store in the global registry. Returns a `DeepReadonly<T>` view for reads.
- `destroyStore(storeRef)`: Tears down a store. Throws if not created.
- Bootstrap a feature at module load: `export const timer = createStore(timerStore)`.
- `DeepReadonly<T>`: Recursive readonly view. Short-circuits on `Ref<T>` so `.current` types as the held value.

## Actions

- `defineAction([storeRefs], handler)`: Binds a tuple of stores to a synchronous handler. Drafts are writable; writes batch into one reactive flush.
- Handler signature: `(...drafts, input?) => void`. Omit the trailing `input` parameter when not needed — the call site becomes zero-arg.
- Typed-input actions require the input at the call site: `useAction(addN)(5)`.
- `Action<Stores, Input>`: Returned tuple. `AnyAction<Input>`: type-erased variant for effect lifecycle slots.

## Effects

- `defineEffect([storeRefs], fn, { onStart?, onSuccess?, onFailure? })`: Wraps a side-effecting callback with lifecycle actions.
- Callback receives a readonly view per declared store followed by the input. Pass `[]` when no state is read.
- `onStart` fires with the effect's input before the callback. `onSuccess` fires with the resolved value. `onFailure` fires with the caught `Error` — without it, errors re-throw.
- Lifecycle slots accept named actions or inline `defineAction(...)` calls.
- Sync callbacks return `void`; callbacks returning a `Promise` make the dispatch return `Promise<void>` via `PerformReturn<Output>`.

## Capabilities and Bindings

- Capabilities are low-level side-effect functions (e.g. `startRecording`, `captureTrack`). They don't import `@lib/state`.
- Bindings pair capabilities with lifecycle actions via `defineEffect`. When an effect needs to read state, declare the stores and use the capability directly as the callback — no wrapper.

## Hooks

- `useStore(storeRef)`: Returns the readonly state from the global registry.
- `useAction(action)`: Returns a callable that dispatches the action. Zero-arg for no-input actions, one-arg for typed input.
- `useEffect(effect)`: Returns a callable that performs the effect. Same call-site arity rules as `useAction`.

## Refs

- `ref(value)`: Wraps a value in an opaque `Ref<T>` with a `.current` property.
- For host objects (media streams, recorders, class instances) that must live in reactive state without being proxied.
- Refs are immutable. Swap by reassigning: `state.handle = ref(next)`.

## Registry

- `createRegistry()`: Builds an isolated registry. App code uses the implicit global registry; tests build their own.
- `bindRegistry(registry)`: Returns the full `RegistryBindings` API (`createStore`, `destroyStore`, `useStore`, `useAction`, `useEffect`, `invoke`, `perform`) scoped to that registry.

## Testing

- `createTestBindings()`: Returns `RegistryBindings` backed by a fresh registry. One call per test keeps state isolated.
- Materialize required stores with `bindings.createStore(storeRef)`, then drive state through `useAction` / `useEffect` and assert on the readonly view.
- Co-locate tests under `__tests__/`. Example: `foo.ts` and `__tests__/foo.test.ts`.
- Common pattern: a `bootstrap()` helper that creates bindings, materializes the stores under test, and spreads them onto the bindings object for ergonomic destructuring.

```ts
const bootstrap = () => {
  const bindings = createTestBindings();
  const counter = bindings.createStore(counterStore);
  return { ...bindings, counter };
};

it('increments', () => {
  const { counter, useAction } = bootstrap();
  useAction(increment)();
  expect(counter.count).toBe(1);
});
```
