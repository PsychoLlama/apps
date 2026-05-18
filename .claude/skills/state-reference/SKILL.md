---
description: Reference docs for `@lib/state` — the codebase's sanctioned state management. Built-in Solid primitives (`createSignal`, `createStore`, `createMemo`) are banned outside `@lib/ui` and storybook stories. Load when authoring or reviewing any stateful code, picking an API, or wiring stateful tests.
---

# State Management

- Single entry point: `@lib/state`.
- State updates are transactional: one action mutates all relevant stores in a single reactive flush. Don't fan out to multiple actions when one will do.
- Side effects belong in effects, never in actions or stores.

## Guidelines

- App is SSG'd. Stores are ready on first paint; reserve loading states for effect-driven async work.
- Naming: `timerStore` → `timer` inside handlers.
- JSDoc every store interface, field, and referenced type (status unions, entity shapes). Describe the role, not the type.

## Structure

- **Stores** initialize state and own its types. Nothing else.
- **Capabilities** are low-level side-effect functions (start recording, fetch, etc.). They may take store views as arguments but otherwise don't depend on `@lib/state`.
- **Actions** describe state changes — synchronous handlers over store drafts.
- **Bindings** wire capabilities to lifecycle actions via `defineEffect`. The integration point.

## Stores

- `defineStore<T>(init)`: Returns a `StoreRef<T>` — opaque handle, no state yet. Module-level constant.
- `createStore(storeRef)`: Materializes the store in the global registry. Returns a `DeepReadonly<T>` view for reads.
- `destroyStore(storeRef)`: Tears down a store. Throws if not created.
- Bootstrap a feature at module load: `export const timer = createStore(timerStore)`.
- `DeepReadonly<T>`: Recursive readonly view. Short-circuits on `Ref<T>` so `.current` types as the held value.

## Actions

- `defineAction([storeRefs], handler)`: Binds a tuple of stores to a synchronous handler. Drafts are writable; writes batch into one reactive flush.
- Handler: `(...drafts, input?) => void`. Omit the trailing `input` parameter when not needed — call site becomes zero-arg.
- Typed-input actions require the input at the call site: `useAction(addN)(5)`.
- `Action<Stores, Input>`: returned tuple. `AnyAction<Input>`: type-erased variant for effect lifecycle slots.

## Effects

- `defineEffect([storeRefs], fn, { onStart?, onSuccess?, onFailure? })`: Wraps a side-effecting callback with lifecycle actions.
- Callback receives a readonly view per declared store followed by the input. Pass `[]` when no state is read.
- When the capability's signature matches, use it as the callback directly — no wrapper.
- `onStart` fires with the input before the callback. `onSuccess` fires with the resolved value. `onFailure` fires with the caught `Error` — without it, errors re-throw.
- Lifecycle slots accept named actions or inline `defineAction(...)` calls.
- Sync callbacks return `void`; `Promise`-returning callbacks make the dispatch return `Promise<void>` via `PerformReturn<Output>`.

## Hooks

- `useStore(storeRef)`: Returns the readonly state from the global registry.
- `useAction(action)`: Returns a callable that dispatches the action.
- `useEffect(effect)`: Returns a callable that performs the effect.
- Call-site arity: zero-arg for no-input, one-arg for typed input.

## Refs

- `ref(value)`: Wraps a value in an opaque `Ref<T>` with a `.current` property.
- For host objects (media streams, recorders, class instances) that must live in reactive state without being proxied.
- Refs are immutable. Swap by reassigning: `state.handle = ref(next)`.

## Registry

- `createRegistry()`: Builds an isolated registry. App code uses the implicit global registry; tests build their own.
- `bindRegistry(registry)`: Returns the full `RegistryBindings` API (`createStore`, `destroyStore`, `useStore`, `useAction`, `useEffect`, `invoke`, `perform`) scoped to that registry.

## Testing

- Test actions and capabilities in isolation. Bindings are rarely worth testing directly — UI tests cover the integration.
- `createTestBindings()`: Returns `RegistryBindings` backed by a fresh registry. One call per test keeps state isolated.
- Co-locate tests under `__tests__/`. Example: `foo.ts` and `__tests__/foo.test.ts`.

```ts
const setup = () => {
  const bindings = createTestBindings();
  const counter = bindings.createStore(counterStore);
  return { ...bindings, counter };
};

it('increments', () => {
  const { counter, useAction } = setup();
  useAction(increment)();
  expect(counter.count).toBe(1);
});
```
