# Topics

A topic is a typed event identity. It names a kind of thing that can happen and declares the payload that describes it.

## Role

- Topics are the vocabulary of the event bus. Every publication targets a topic; every subscription names topics.
- Identity is by reference. Two topics are equal only if they are the same value.
- The payload type lives on the topic. Publishers and subscribers both read that type — no duplication.

## Goals

- **Compile-time safety.** The payload type on a topic flows to every `publish` and every subscription handler. Mismatches fail at `tsc`.
- **No string IDs.** Identity is the topic value itself. No registry of names, no collisions, no debug strings in runtime code.
- **Cheap to create.** Declaring a topic is a one-line constant. No boilerplate.
- **Transparent to the bus.** The bus treats every topic the same. Topic groupings (lifecycles, transitions, triples) compose from bare topics; the bus learns no new concepts.

## Shape

- `defineTopic<Payload = void>(): Topic<Payload>` — creates a typed topic. Runtime value is a `Symbol`.
- `useTopic(topic, bus?)` — binds a topic to a bus and returns a callable publisher. Void topics return `() => void`; typed topics return `(payload) => void`.
- `Topic<Payload>` is an opaque branded symbol. The payload type is phantom.

## Non-goals

- No runtime strings, names, descriptions, or debug labels on a topic. Display names come from a build-time transform, not user-authored strings.
- No hierarchy, namespacing, or wildcard subscriptions. Group topics by importing them from a common module.
- No versioning or schema evolution support. Change the payload type, change the type errors.
- No inherent retry, delivery, or persistence semantics. Those belong (if ever) to layers above the topic primitive.
