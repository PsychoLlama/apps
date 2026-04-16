# State Management

- Import from `#state`.
- Pub-sub architecture. Workflows orchestrate side effects, stores react to them.

## Workflows

- `defineWorkflow((ctx, input) => result)` creates a workflow with `started`, `resolved`, and `rejected` lifecycle topics.
- Omit `input` for workflows that take no arguments.
- `useWorkflow(workflow, bus?)` binds a workflow to a bus and returns a callable runner.
- Calling the runner publishes `started`, executes the workflow, then publishes `resolved` with the return value or `rejected` with an `Error`.
- Sync runners return `void`. Async runners return `Promise<void>`. The return value is delivered through `resolved`.
- Unhandled rejections (no subscriber on `rejected`) re-throw the error.
- `ctx.run(activity, ...args)` is how workflows invoke activities.

## Activities

- `defineActivity({}, executor)` wraps an impure function in an opaque `ActivityDef`.
- Activities are the boundary for side effects: network calls, DOM access, timers.
- Executed through `ctx.run(activity, ...args)` inside workflows.

## Stores

- `defineStore(init, transitions)` returns a factory. Call the factory to create an instance.
- `init` returns the initial state object.
- `transitions(on)` registers topic handlers. `on(topic, (state, payload) => void)` mutates state directly (SolidJS `produce`).
- The factory returns `[state, dispose]`. `state` is a SolidJS reactive store with fine-grained reactivity.
- `dispose` unsubscribes from all topics.

## Topics

- `defineTopic<Payload>()` creates a typed event identity. Runtime value is a `Symbol`.
- Payload defaults to `void` when omitted.
- Workflows create lifecycle topics automatically. Define custom topics for application-level events.
- `useTopic(topic, bus?)` binds a topic to a bus and returns a callable. Void topics return `() => void`, typed topics return `(payload) => void`.

## Event Bus

- `createEventBus()` creates an isolated bus. Stores and workflows default to `GLOBAL_EVENT_BUS`.
- `publish(bus, topic)` for void topics. `publish(bus, topic, payload)` for typed topics. Returns `true` if any handler was called.
- `subscribe(bus, topics, handler)` listens to multiple topics with one handler. Returns an unsubscribe function.
- The handler receives `(topic, payload)`. The topic identifies which subscription fired.

## Refs

- `ref(value)` wraps a value in an opaque `Ref<T>` with a `.current` property.
- Use for host objects (media streams, recorders) that must live inside a store without proxy descent.
- Refs are immutable. Swap by reassigning: `state.recorder = ref(next)`.
- No automatic release. Clean up the held value explicitly before dropping the ref.

## Testing

- Create an isolated `EventBus` per test to prevent shared state.
- Wire stores and workflows to the same bus, then assert against store state after running workflows.
