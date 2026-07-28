---
description: Reference docs for `@lib/state` — the codebase's sanctioned state management, a transactional runtime of topics, folds, scopes, and sagas. Built-in Solid primitives (`createSignal`, `createStore`, `createResource`) are banned outside `@lib/ui` and `@lib/design`. Load when authoring or reviewing any stateful code, picking an API, or wiring stateful tests.
---

# State Management

- Single entry point: `@lib/state`.
- The model is space/time/life. Space: stores, cells, formulas. Time: topics (facts) and folds (transitions). Life: scopes (ownership) and sagas (processes).
- The one law: sagas publish facts, folds fold facts into state, readers derive. Sagas never touch stores directly.
- Handles are named by kind: `…Store`, `…Cell`, `…Formula`, `…Topic`, `…Scope`, `…Saga`. Assignments holding resolved values drop the suffix: `const foo = useValue(fooStore)`.

## Topics & Facts

- `defineTopic<Payload>()`: Returns a callable topic. Calling it wraps a payload into an inert fact — `[topic, payload]` — that does nothing until committed. Module-level constant.
- Omit the type parameter for payload-less topics; the fact constructor becomes zero-arg.
- Topics are module-private by default. Export one when other features should fold it — it's the feature's outbound contract.

## Space

- `defineStore<T>(scope, init)`: A deeply-reactive record owned by a scope. Readers get `DeepReadonly<T>` views.
- `defineCell<T>(scope, init, { drop? })`: A single swappable value, never proxied — the home for host objects (media tracks, sockets, wasm handles). `drop` runs once with the held value when the scope dies.
- `defineFormula([deps], compute)`: Derived state over stores, cells, and other formulas. Computed with tracked reads; consumers re-run when dependencies change.
- Space materializes lazily on first touch and only while its scope is anchored.

## Folds

- `defineFold(topic, [refs], handler)`: Subscribes stores/cells to a topic. The handler is a pure synchronous fold: writable drafts in ref order, then the payload (omitted for payload-less topics).
- Cell drafts are `{ current }` boxes; store drafts are mutable records.
- A commit carries one or more facts; every subscribed fold runs in causal order within a single reactive flush. Multiple features folding the same fact commit atomically.
- Folds are the only writers. Keep them in the owning module — write access stays private, reads stay public.

## Scopes

- `defineScope()`: The unit of ownership and lifetime. Owns stores, cells, and running sagas. Module-level constant.
- `anchor(scope)`: Pins the scope alive; returns an idempotent release. Anchors are refcounted — the last release aborts sagas, runs cell drops, and deallocates space.
- `useAnchor(scope)`: Pins the scope to the current reactive owner (released on cleanup).

## Sagas

- `defineSaga(scope, async function* (input) { ... })`: A process owned by a scope. Calling the result produces an inert invocation.
- Saga vocabulary (everything is an instruction value):
  - `yield commit(...facts)` — publish one transition: N facts, one flush.
  - `yield* call(capability, ...args)` — run a side-effect function; the scope's `AbortSignal` is injected as its first argument.
  - `yield* read(ref)` — untracked snapshot of a store, cell, or formula.
  - `yield* otherSaga(input)` — sequential child.
  - `yield* all(a(), b())` — concurrent children; commits pass through as they happen.
  - `yield* atomic(a(), b())` — concurrent children; commits are held and fused into one transition when all settle. All-or-nothing on failure.
  - `yield* spawn(child())` — detached child owned by the same scope; never fused, dies with the scope.
- Capabilities are plain functions `(signal, ...args) => result` with no knowledge of this library.
- Instruction failures throw back into the saga (`try/catch`, then commit a recovery fact). Unhandled failures reject the `run(...)` promise; failures escaping spawned sagas escalate loudly.

## Runtime & Hooks

- `useValue(ref)`: Reactive accessor for a store view, cell value, or formula result.
- `peek(ref)`: Untracked read.
- `useCommit()`: Returns `(...facts) => void` — commit straight from UI for simple synchronous interactions. One call, N facts, one transition.
- `run(saga(input))` / `useRun(saga)`: Drive a saga; resolves with its return value.
- `AbortError`: Rejection class for cancelled work. Match with `instanceof`.
- `createRuntime()` / `bindRuntime(runtime)`: Isolated runtimes; app code uses the implicit global bindings.

## Testing

- `createTestRuntime({ calls? })`: Fresh isolated runtime per test. `calls` is `[real, stub]` capability pairs resolved by identity. Extra surface: `ledger()` (every commit, in order) and `failures()` (errors from spawned sagas).
- Test folds by committing facts and asserting state — no sagas involved.
- Test sagas with `simulate(saga(input), { calls?, reads? })` — no runtime, no state. The trace records `commits` (one entry per transition, `atomic` fusion included), `spawns`, and `result`.
- Define fixture topics/stores/scopes inside a per-test setup function so fold subscriptions don't accumulate across tests.

```ts
const setup = () => {
  const testScope = defineScope();
  const counterStore = defineStore<Counter>(testScope, () => ({ count: 0 }));
  const addedTopic = defineTopic<number>();
  defineFold(addedTopic, [counterStore], (draft, amount) => {
    draft.count += amount;
  });
  const bound = createTestRuntime();
  bound.anchor(testScope);
  return { ...bound, counterStore, addedTopic };
};

it('adds', () => {
  const { commit, peek, counterStore, addedTopic } = setup();
  commit(addedTopic(2), addedTopic(3));
  expect(peek(counterStore).count).toBe(5);
});
```
