# State Management Vision

## Problem

### 1. State ownership is coupled to the component hierarchy

Client-side frameworks give you primitives for rendering state but no primitives for managing the lifecycle of the things that produce state. Hooks, signals, refs — they all tie state to the component that creates it. That works when the state lifecycle coincidentally aligns with the rendering hierarchy, but it breaks the moment it doesn't.

A character counter belongs in the text area — until product says "show a form-level error when it exceeds 500 characters." Now the count is owned by the form. A track's mute state belongs in the track component — until you need a "mute all" button in a toolbar three levels up. The rendering hierarchy is driven by layout and product requirements. State lifecycles are driven by domain logic. These are fundamentally different topologies, and forcing one onto the other creates coupling that is fragile under product change.

This gets severe with resource-heavy domains: WebRTC peer connections, GPU pipelines, audio processing graphs. These systems have their own lifecycles driven by network events, device changes, and user actions — none of which map to the component tree. You end up contorting the rendering hierarchy to match the state lifecycle, or plumbing callbacks through layers of components to get events back to whichever component is pretending to own the state.

### 2. Application logic is trapped inside the rendering layer

When state lives in components, the logic that manages it lives there too. Event handlers, effect hooks, and lifecycle callbacks become the home for domain logic — connection management, retry policies, state machines. This has two consequences:

**Testing requires the DOM.** The dominant testing strategy is "render the component into a DOM-like environment and simulate click events." But the thing you actually want to test isn't the component — it's the logic underneath. Does the retry policy work? Does the state machine transition correctly when a device disconnects? Those questions don't involve the DOM at all, but you can't test them without it because the logic is embedded in component code.

**Composition breaks.** Domain logic in components can't be shared, composed, or reused independently. A peer connection manager locked inside a React component can't be used by a different component, a different page, or a background worker without extracting it — which usually means rewriting it.

The goal is to restore ownership of application logic to independent, testable units that can be applied to components but are not tied to them.

### 3. No observability

Components give you a mechanism for producing and consuming state but almost no visibility into how it changes, why it changes, or any broader view of the application. `setState` fires and the UI updates. Why? What led to this state? What else changed? The answers are buried in a call stack across scattered event handlers.

Debugging means reading code and reconstructing the sequence of events in your head. This has always been hard, but it's becoming untenable as AI-assisted development increases code volume. Developers can no longer spend all their time reading code because there's simply too much of it. Observing behavior is more powerful than reading implementation — but only if the tools exist to observe it.

A workflow event log that shows "user clicked → addCamera started → getUserMedia retried twice → timed out → store updated with error" is immediately actionable. Reconstructing that from `useState` hooks and `console.log` is not.

This observability benefits humans and agents alike. An LLM debugging a failure can read a structured event log and dive into the relevant diff rather than piecing together causality from source code.

## Design

### Topics

Topics are typed pub-sub channels. They carry a payload type but have no coupling to the state they affect.

```ts
const trackAdded = defineTopic<MediaStreamTrack>();
const recordingStarted = defineTopic();
```

`defineTopic` is aliased to `Symbol` — zero runtime overhead, no function call. Type safety is purely phantom: `Topic<T>` is `symbol & { [PHANTOM_FIELD]: T }`, where `PHANTOM_FIELD` is a declared-but-never-assigned unique symbol. The payload type is recovered through the generic on `subscribe` and `on`, not through the symbol's identity.

### Event Bus

The event bus is a null object with private symbol state. Free functions operate on it.

```ts
const eventBus = createEventBus();

publish(eventBus, trackAdded, track);

subscribe(eventBus, [topicA, topicB], (topic, payload) => {
  // topic identifies which fired, payload is the data
});
```

`subscribe` accepts an iterable of topics and registers a single handler for all of them. The handler receives the topic that fired alongside the payload. This allows stores to subscribe once for all their topics instead of N times.

A global bus (`GLOBAL_EVENT_BUS`) is the default for production. Local buses provide test isolation.

### Stores

Store definition is separate from store construction. `defineStore` captures the transition logic; the returned factory creates instances bound to a bus.

```ts
const createRecording = defineStore<RecordingState>(
  () => ({
    tracks: new Set(),
    state: IDLE,
  }),
  (on) => {
    on(trackAdded, (state, track) => {
      state.tracks.add(track);
    });

    on(recordingStarted, (state) => {
      state.state = RECORDING;
    });
  },
);

const [state, dispose] = createRecording(eventBus);
```

Internally, the factory collects topic-to-handler bindings in a `Map`, then issues a single `subscribe` call for all topics. On publish, the handler Map lookup narrows to the right transition and runs one `produce` call. Duplicate handlers for the same topic throw.

Handlers receive the current state (wrapped in Solid's `produce`) and the event payload, both fully inferred. The `on` callback API was chosen over computed-key syntax (`{ [topic](payload) {} }`) because TypeScript collapses symbol index signatures to `[key: symbol]: V`, erasing payload types. The generic `on<T>(topic: Topic<T>, handler)` preserves full inference.

Dispose is idempotent and cleans up all subscriptions. The bus removes empty listener sets on unsubscribe.

### Testing

The event bus is the isolation seam. No DOM, no component rendering, no simulated clicks.

```ts
const eventBus = createEventBus();
const [state, dispose] = createRecording(eventBus);

publish(eventBus, trackAdded, track);
expect(state.tracks.size).toBe(1);
```

Each test creates its own bus. Parallel tests don't leak state.

### Activities

Activities are impure — side effects live here. They are opaque handles created with `defineActivity`, which takes an options object (empty for now, will support retries and timeouts later) and an executor function.

```ts
const fetchUser = defineActivity({}, async (userId: string): Promise<User> => {
  const res = await fetch(`/users/${userId}`);
  return res.json();
});
```

The implementation is stored behind a private symbol. Activities are executed indirectly through `ctx.run` inside workflows — never called directly.

### Workflows

Workflows are pure orchestrators, inspired by Temporal. They tie effects together in an observable form, running activities through `ctx.run`. Workflows define their own lifecycle topics automatically.

```ts
const getUser = defineWorkflow(async (ctx, userId: string): Promise<User> => {
  return await ctx.run(fetchUser, userId);
});
```

`defineWorkflow` returns an opaque handle with `.started` and `.settled` topics, both inferred from the workflow's type signature. `getUser.started` is `Topic<string>`, `getUser.settled` is `Topic<Result<User>>`.

`run(eventBus, workflow, ...args)` executes a workflow: publishes `started`, runs the function, publishes `settled` with the result. Errors propagate into the workflow for try/catch; unhandled errors settle with `REJECTED`. The return type is polymorphic — `void` for sync workflows, `Promise<void>` for async.

#### Results

`Result<T>` is a discriminated union using unique symbol constants (`RESOLVED`/`REJECTED`) instead of strings. No string literals in the bundle. Callers must handle both cases.

```ts
const createUsers = defineStore<UsersState>(
  () => ({ users: new Map(), loading: false }),
  (on) => {
    on(getUser.started, (state, userId) => {
      state.loading = true;
    });

    on(getUser.settled, (state, result) => {
      state.loading = false;
      if (result.type === RESOLVED) {
        state.users.set(result.value.id, result.value);
      }
    });
  },
);
```

### Open questions

- **Observability surface.** The global bus is the natural tap point for dev tools, logging, and debugging. A structured log of every publish — topic identity, payload, which stores handled it, what state changed — falls out naturally.
- **Activity options.** Retries, timeouts, and backoff policies. The `defineActivity({}, executor)` signature is ready — just needs fields.
- **Workflow cancellation.** Not yet implemented. Temporal-style cancellation via `CancellationError` is the likely direction.
