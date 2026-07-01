---
description: Reference docs for `@lib/messaging` — a typed, bidirectional RPC over pluggable transports (web workers, MessagePorts, etc.). Load when authoring or reviewing any cross-thread/cross-context messaging, wiring a worker boundary, or looking up an RPC type.
---

## Transport - `@lib/messaging/transport`

- Interface over a bidirectional stream.
- Each implementation gets their own implementation (i.e. `@lib/messaging/message-port`).
- Implementations may support more features, i.e. `transport.start()` or custom `send` options.
- Each implementation has its own entrypoint from `@lib/messaging/*`.

```ts
export interface Transport<Inbound, Outbound, Options = never> {
  send: (message: Outbound, options: Options) => void;
  onMessage: (handler: MessageHandler<Inbound>) => Unsubscribe;
}
```

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

rpc.notify('ready', payload); // void
rpc.request('status', payload, options); // Promise<string>
rpc.request('mint'); // Promise<ArrayBuffer> (no payload)
rpc.close(); // Tear down listeners, block outbound. Transport must be closed separately.
```

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

### BroadcastChannelTransport - `@lib/messaging/broadcast-channel`

- Wraps `BroadcastChannel`. Pure pub/sub: no per-send options, no responses. Use `send`/`onMessage` directly — RPC's request/response can't ride a broadcast.
- Owns its channel: construct with a config object (`{ channel, localEmit? }`); `close()` closes the channel (which stops delivery) and drops self-emit handlers. A `BroadcastChannel` can't be reopened.
- By default a channel withholds every post from the instance that sent it. Set `localEmit: true` and `send` also replays to this instance's own handlers, so one transport can both publish and observe its own writes.

## Testing

As a consumer, avoid testing the RPC harness. Test handlers directly.
