# Observability

A dev-time lens onto the event graph. Captures what happened, in what order, caused by what — as structured data that tools and agents consume equally well.

## Role

- A separate system layered over the bus, stores, and orchestration primitives. The core primitives stay lean; observability attaches to them from the outside.
- Records every event on the bus, every state change in every store, and the causal context linking them.
- Emits structured records. Any UI (inspector panel, timeline view, CLI dump) is a consumer, not a requirement.

## Goals

- **Zero production overhead.** The entire observability layer compiles out of production builds. No dead imports, no runtime branches, no shipped bytes. A production binary behaves as if the system were never written.
- **Data-first.** Records are plain data structures holding live references — topic symbols, typed payloads, and function references to the handlers that ran. Humans read them through a UI; agents read the same records directly. No pre-rendered strings, no formatted log lines.
- **Identity by reference, not by name.** A handler is identified by its function reference, a topic by its symbol, a store by its instance. An inspector dereferences these to find source locations, names, or state — it does not invent string IDs the runtime must maintain.
- **Causal attribution without payload pollution.** The causal chain linking a trigger to its downstream effects and state changes is carried out-of-band, not stuffed into typed payloads. Domain code never sees observability metadata.
- **Complete coverage by construction.** Because the bus is the chokepoint for every event and stores own every write, instrumenting those two seams captures the whole graph. Domain code is never asked to emit observability events manually.

## Shape

- A record stream. Each record names what happened (event, state change, effect lifecycle), when it happened, the causal context it happened inside, and direct references to the runtime values involved — the topic symbol, the payload, the handler function, the store instance.
- Causal context is an identity threaded through the dispatch stack. Publications, handlers, and child publications triggered inside a handler all share it.
- Records are append-only and ordered. The order captured is the order of execution on the bus.
- Consumers attach to the stream without coupling to the core primitives. Multiple consumers can attach simultaneously.

## Non-goals

- No production telemetry. This is not a metrics system, tracing backend, or log pipeline.
- No serialization requirement. Records hold live references and are not required to round-trip through JSON.
- No sampling, aggregation, or alerting. Records are complete within a dev session; analysis happens in consumers.
- No remote collection. The record stream lives in the process that generated it.
- No changes to core primitive APIs to accommodate observability. If a capture cannot be derived from the existing seams, the capture doesn't happen — the primitive API doesn't grow a debug hook.
- No human-only formatting. Records carry no pre-rendered strings. Display is entirely a consumer concern.
