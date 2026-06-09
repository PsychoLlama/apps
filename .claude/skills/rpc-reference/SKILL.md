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
- `Options` are accepted as the final param if your transport allows it.

```ts
const handlers = {
  // requests optional
  requests: {
    status: async (payload, options) => {
      options.transfer = []; // Transferable[] (depending on underlying transport)
      return 'online';
    },
  },

  // events optional
  events: {
    ready: (payload) => {},
  },
};

export type Remote = typeof handlers; // `Local` has same shape.
```

```ts
const rpc = RPC.from<Local, Remote, SendOptions>(transport, handlers);

rpc.notify('ready', a, options); // undefined
rpc.request('status', b, options); // Promise<'online'>
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
