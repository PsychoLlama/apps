## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `@lib/messaging`.
- This package defines the transport-agnostic contract for typed, bidirectional messaging — nothing more. Concrete transports live in adapters.

## Core contract

- `Channel<Inbound, Outbound>` is the base interface every adapter implements: `send` (outbound) and `onMessage` (inbound).
- `Inbound`/`Outbound` are discriminated unions of `Message` (`{ type: string }`). The `type` field is the discriminant handlers narrow on.
- Directions are from the local endpoint's perspective. The peer holds the mirror: `Channel<Outbound, Inbound>`.

## Adapters (future)

- First planned adapter: `MessageChannel` ports (and anything matching that shape, e.g. workers). Not yet implemented.
- An adapter wraps a concrete transport behind `Channel` so callers stay decoupled from it.
