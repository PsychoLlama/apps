# Event Bus

The substrate everything else sits on. A bus routes topic publications to their subscribers. It owns no state beyond its subscriber table.

## Role

- A bus is one isolated event graph. Publishers and subscribers share state only through a bus they both hold.
- Stores and any orchestration layer wire to a bus — never to each other directly.
- The bus is the single chokepoint every event passes through.

## Goals

- **Isolation.** Multiple buses coexist with zero shared state. `createEventBus()` is always cheap and always fresh.
- **Typed delivery.** Payload types flow from topic → publisher → subscriber with no casts in user code.
- **Synchronous fan-out.** Publishing runs subscribers in registration order on the same stack. Predictable, debuggable, no microtask surprises.
- **Single-handler ergonomics across many topics.** One subscription can listen to a set of topics and branch on topic identity.

## Shape

- `createEventBus(): EventBus` — fresh bus.
- `GLOBAL_EVENT_BUS: EventBus` — default bus used when no explicit bus is passed.
- `publish(bus, topic, payload?): boolean` — returns true if any handler fired.
- `subscribe(bus, topics, handler): () => void` — listens to an iterable of topics with one handler; returns unsubscribe.
- `EventBus` is an opaque branded type. Internals are not exposed.

## Non-goals

- No persistence, no replay, no backlog. A publication with no subscribers is lost.
- No cross-bus forwarding or federation.
- No ordering guarantees across publications on different topics.
- No async delivery, queues, or scheduling. Handlers run immediately, in order.
- No middleware layer on the bus itself.

## Testing

- Each test creates its own bus. The global bus is not acceptable for tests.
- Subscriptions on a fresh bus start empty. Disposing a subscription removes exactly its handler.
