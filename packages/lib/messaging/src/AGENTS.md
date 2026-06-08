## Guidance

- `index.ts` is the only public API. Imported as `@lib/messaging`.
- This package owns the transport-agnostic contract. Keep concrete transports in adapters, not here.
- `Channel` is the base interface every transport implements. Don't widen it for one adapter's convenience.
- Message unions must extend `Message`. Keep `type` a present, literal discriminant.

## RPC

- Build typed request/response on `RPC`; construct via `RPC.from`.
- Pick the call style by semantics: `request` when you await a result, `notify` for fire-and-forget. Never fake one with the other.
- Define an endpoint's procedures as an `RpcApi`. A procedure takes zero or one argument, never more.
- Request handlers signal failure by throwing — don't encode errors as success values. Throw `RpcError` for deliberate failures; any other throw is an internal bug.
- Treat inbound data as untrusted — peers may be foreign origins or the network. Never let an inbound name reach inherited object members.

## Adapters (future)

- An adapter wraps a concrete transport behind `Channel` so callers stay decoupled from it.
- First planned: `MessageChannel` ports (and worker-style equivalents).
