---
description: Reference docs for `@lib/messaging` — a typed, bidirectional RPC over pluggable transports (web workers, MessagePorts, etc.). Load when authoring or reviewing any cross-thread/cross-context messaging, wiring a worker boundary, or looking up an RPC type.
---

## Transport - `@lib/messaging/transport`

- Interface over a bidirectional messaging channel.
- Each implementation gets their own implementation (i.e. `@lib/messaging/message-port`).
- Implementations may support more features, i.e. `transport.start()` or custom `send` options.
- Each implementation has its own entrypoint from `@lib/messaging/*`.

```ts
export interface Transport<
  Inbound,
  Outbound,
  Options = never,
> extends AsyncDisposable {
  send: (message: Outbound, options: Options) => Promise<void>;
  onMessage: (handler: MessageHandler<Inbound>) => Unsubscribe;
  [Symbol.asyncDispose]: () => Promise<void>;
}
```

- `send` resolves once the carrier accepts the message, rejects if it couldn't (unserializable payload, closed socket, timeout).
- A rejection describes **that message, not the channel**. The transport stays usable; a dead carrier fails every subsequent send.
- Messages reach the carrier in call order even when the promises settle out of order. Await a send to know it succeeded, never to sequence the next one.
- `onMessage` handlers are notified, not awaited. There is no read-side backpressure — async work is the handler's own.
- Every transport is `AsyncDisposable` — async only, no `Symbol.dispose`. Bind with `await using` so it can't leak.

## RPC - `@lib/messaging/rpc`

- Composes a `Transport` to provide request/response and events.
- Event: fire-and-forget.
- Request: wait for a response.
- Event and request handlers accept an optional payload.
- Request handlers may take the transport's mutable `options` bag as a 2nd param; `events` stay params-only.
- `Options` are accepted as the final param at the call site if your transport allows it.
- Use `defineContract<Options>()(...)` to define RPC contracts.

```ts
// One source of truth: author handlers, derive the contract from the same value.
const api = defineContract<SendOptions>()({
  // requests optional
  requests: {
    status: (payload: string): string => 'online',
    mint: (_payload: void, options) => {
      const buffer = new ArrayBuffer(8);
      options.transfer = [buffer]; // hand the buffer over by reference
      return buffer;
    },
  },
  // events optional
  events: {
    ready: (payload: string) => {},
  },
});

export type Local = typeof api; // params-only contract; the peer imports it as Remote.
```

```ts
const rpc = RPC.from<Local, Remote, SendOptions>(transport, api);

void rpc.notify('ready', payload); // Promise<void> — discard only if a lost event is fine
rpc.request('status', payload, options); // Promise<string>
rpc.request('mint'); // Promise<ArrayBuffer> (no payload)
rpc.close(); // Tear down listeners, block outbound. Transport must be closed separately.
```

- `notify` resolves once the transport accepts the event, rejects if the send failed. Awaiting it never proves the peer ran its handler — only a round-trip `request` does.
- `request` rejects if its send fails, rather than hanging on a reply that was never coming.
- **Nothing throws synchronously.** A closed endpoint, a failed send, and a remote handler error all arrive as rejections, so one `catch` covers the call. Discarding a `notify` promise discards its errors too.
- `RPC` is `AsyncDisposable`; `close()` is the manual equivalent. It never touches the transport — bind that separately in the same scope.
- A reply whose send fails is **dropped** — no local caller to reject, so the peer's request stays pending until its own endpoint closes. Surfacing these needs a caller-supplied observability hook; `@lib/messaging` can't log it without cycling through `@lib/observability`.

### Errors

- `RpcError`: a remote request handler threw. Throw it deliberately from a handler for an _expected_ failure.
- `RpcClosedError`: the endpoint was closed. Deliberately **not** an `RpcError`: a close is a local lifecycle event, not a remote failure.

## Available Transports

If you need a transport implementation and one does not yet exist, propose it to the user.

### MessagePortTransport - `@lib/messaging/message-port`

- Wraps `MessagePort`.
- Designed for same-origin messaging: workers, worklets, brokered `MessageChannel`.
- Inappropriate for cross-origin messaging.
- Supports transferable objects as `SendOptions['transfer']`.
- `postMessage` is synchronous underneath, so a send only fails for reasons visible at the call site — usually a `DataCloneError`. A resolved send means the endpoint accepted the message, not that the peer processed it.
- Disposal detaches this transport's handlers and leaves the port open. It never opened or started the port, so closing it belongs to whoever did.

### BroadcastChannelTransport - `@lib/messaging/broadcast-channel`

- Wraps `BroadcastChannel`. Pure pub/sub: no per-send options, no responses. Use `send`/`onMessage` directly — RPC's request/response can't ride a broadcast.
- One `Message` type rides both directions (`BroadcastChannelTransport<Message>`) — a broadcast is undirected, so inbound and outbound are the same feed.
- Owns its channel: construct with a config object (`{ channel, selfDeliver }` — both required); bind with `await using`, or call `close()` where a scope-bound lifetime doesn't fit.
- `send` resolves once the channel accepts the post; a broadcast has no acknowledgement, so it never reports whether anyone was listening. It rejects only when the post can't be made at all.
- A channel withholds every post from the instance that sent it. Set `selfDeliver: true` and `send` also replays to this instance's own handlers, so one transport can both publish and observe its own writes; `false` keeps the sibling-only default.

## Testing

As a consumer, avoid testing the RPC harness. Test handlers directly.

Bind transports and endpoints with `await using` so teardown survives a thrown assertion. To test detachment, let the transport's block exit, then post from a live sibling and assert the disposed one heard nothing.
