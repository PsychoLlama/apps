## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `@lib/messaging`.
- This package owns the transport-agnostic messaging contract. Keep concrete transports in adapters, not here.
- `Channel<Inbound, Outbound>` is the base interface. New transports implement it; don't widen it for one adapter's convenience.
- Message unions must extend `Message` (`{ type: string }`). `type` is the discriminant — always present, always literal.

## RPC

- Build typed request/response on `RPC`. Don't hand-roll id correlation per call site.
- Construct via `RPC.from(channel, handlers)` — the constructor is private.
- Pick the call style by semantics: `request` when you await a result, `notify` for fire-and-forget events. Never fake one with the other.
- Define an endpoint's procedures as an `RpcApi` (`requests` + `events`). Use inline object types; pass `{}` for an empty side.
- Every procedure takes exactly one argument — a single `params` payload. Enforced at the type level; never zero, never more.
- Request handlers signal failure by throwing — callers receive an `RpcError`. Don't encode errors as success values.
- Throw a typed `RpcError(type, message)` so callers can discriminate failures; non-`RpcError` throws surface as `RpcErrorType.Internal`.

## Adapters (future)

- First planned adapter: `MessageChannel` ports (and worker-style equivalents). Not yet implemented.
- An adapter wraps a concrete transport behind `Channel` so callers stay decoupled from it.
