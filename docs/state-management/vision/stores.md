# Stores

A store is a reactive state container bound to an event bus. It holds one typed value and exposes fine-grained reactivity to consumers.

## Role

- Stores are the readable state of the application. UI and logic read directly from them.
- A store is isolated to the bus that created it. Two buses produce two independent instances from the same definition.
- State writes happen only in response to bus events. External code never mutates store state directly.

## Goals

- **Typed state.** The state's TypeScript type is the source of truth. Readers get exact types without casts.
- **Fine-grained reactivity.** Built on SolidJS `createStore`. Components that read one field rerender only when that field changes.
- **Direct read access.** `store.foo` is how you read state. No accessor function, no selector layer, no hook call required outside a component.
- **One bus, one instance.** A store definition can be instantiated multiple times against different buses. A single instance per definition is the norm against the global bus.
- **Opaque handles for host objects.** State can hold `Ref<T>` wrappers for values (MediaStream, Recorder) that should not be proxied or descended into by the reactivity system.
- **Disposable.** Every instance can be disposed, releasing its bus subscription cleanly and idempotently.

## Shape

- A store definition is a factory. Calling the factory against a bus produces an instance and a disposer.
- State is read directly off the instance. Writes happen only through the store's reactions to bus events.
- `Ref<T>` / `ref(value)` wraps values the reactivity system treats as opaque handles. Refs are immutable; swap by reassigning the field.
- `dispose(): void` unsubscribes the store from the bus. Safe to call more than once.

## Non-goals

- No middleware or interception layer around writes.
- No persistence, hydration, or snapshot/restore built in.
- No cross-bus synchronization.
- No global selector or computed-value registry. Derived values use SolidJS primitives at the read site.
- No dynamic schema changes. A store's type is fixed at definition.

## Testing

- Each test creates a fresh bus and instantiates the store against it.
- Assertions read `state.foo` directly after publishing events to the bus.
- Dispose is called between tests so a leaked subscription is diagnosable.
