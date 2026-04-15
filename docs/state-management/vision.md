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

### Events

Events are typed signals. They carry a payload type but have no coupling to the state they affect.

```ts
const trackAdded = defineEvent<MediaStreamTrack>();
const recordingStarted = defineEvent();
```

Under the hood, events are branded symbols. They do not need to be `unique symbol` because type safety comes from the `on` callback's generic signature, not from symbol key identity.

### State

State is defined independently of the component tree. There is no setter — state is updated exclusively through event handlers.

```ts
const recording = defineState<RecordingState>(
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
```

`defineState` takes an initializer and a setup callback. The `on` function binds events to state mutations. Handlers receive the current state (wrapped in Solid's `produce`) and the event payload, both fully inferred.

The `on` callback API was chosen over computed-key syntax (`{ [event](payload) {} }`) because TypeScript collapses symbol index signatures to `[key: symbol]: V`, erasing payload types. The generic `on<T>(event: EventDef<T>, handler)` preserves full inference.

### Workflows

Workflows are higher-level primitives that tie effects together in a cancelable, observable form. They define their own lifecycle events.

```ts
const getUser = defineWorkflow(async (ctx, userId: string): Promise<User> => {
  return await ctx.run(Http.GET, `/users/${userId}`);
});
```

Workflow lifecycle events are properties on the workflow object. State handlers subscribe to them through the same `on` function used for plain events.

```ts
defineState<UsersState>(
  () => ({ users: new Map(), loading: false }),
  (on) => {
    on(getUser.started, (state, userId) => {
      state.loading = true;
    });

    on(getUser.settled, (state, result) => {
      if (result.type === 'resolve') {
        state.users.set(result.value.id, result.value);
      }
      state.loading = false;
    });
  },
);
```

The workflow owns its event definitions. `getUser.started` is an `EventDef<string>` (inferred from the workflow's input type) and `getUser.settled` is an `EventDef<Result<User>>` (inferred from its output type). No separate event declarations needed — the workflow's type signature drives everything.

### Dispatch

Events are dispatched through a central event bus. The bus is the connective tissue — it routes events to every store that subscribes to them, and it's the single point of observability for the entire system.

```ts
import { dispatch } from '#state';

dispatch(trackAdded, track);
```

Stores bind to a global bus by default. This makes stores importable as module-level singletons — no provider wrappers, no context lookups.

```ts
import { users } from './stores/users';

// Read state directly — reactive in components, snapshot outside
users.state.loading;
```

#### Testing

Global state is bad for tests. The event bus is the isolation seam: stores accept a local bus, overriding the global default.

```ts
const bus = createEventBus();
const store = users.create(bus);

bus.dispatch(getUser.started, 'user-123');
expect(store.state.loading).toBe(true);
```

No DOM, no component rendering, no simulated clicks. The store is a pure function of events. The bus scopes the test so parallel tests don't leak state into each other.

#### Open questions

- **Store initialization timing.** `defineState` returns a definition. When does the Solid store get created? Eagerly on import (simple, predictable) or lazily on first access (avoids unused stores)? Eager is simpler. Lazy is more efficient. Leaning eager — unused stores are a code smell, not a performance problem.
- **Bus as the observability surface.** The global bus is where dev tools, logging, and debugging tap in. A structured event log of every dispatch — event identity, payload, which stores handled it, what state changed — falls out naturally. This is the answer to Problem 3.
