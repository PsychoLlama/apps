## Guidance

- `index.ts` is the transport-agnostic core, imported as `@lib/messaging`. Adapters get their own subpath export (e.g. `@lib/messaging/channel`).
- This package owns the contract. Keep concrete transports in adapters, not the core.
- `Channel` is the base interface every transport implements. Don't widen it for one adapter's convenience.
- Message unions must extend `Message`. Keep `type` a present, literal discriminant.

## RPC

- Build typed request/response on `RPC`; construct via `RPC.from`.
- Pick the call style by semantics: `request` when you await a result, `notify` for fire-and-forget. Never fake one with the other.
- Define an endpoint's procedures as an `RpcApi`. A procedure takes zero or one argument, never more.
- Request handlers signal failure by throwing — don't encode errors as success values. Throw `RpcError` for deliberate failures; any other throw is an internal bug.
- Treat inbound data as untrusted — peers may be foreign origins or the network. Never let an inbound name reach inherited object members.
- Pass per-call concerns (e.g. `transfer`) through the options object on `request`/`notify`, never as positional args. Transfer is only meaningful for a procedure that takes a payload.

## Adapters

- An adapter wraps a concrete transport behind `Channel` so callers stay decoupled from it.
- For `MessagePort`/worker transports, wrap the endpoint with `fromMessagePort` from `@lib/messaging/channel`.
- A transport supporting zero-copy transfer brands itself via `asTransferable`; detect it with `isTransferable`. Don't fabricate the brand by hand.
