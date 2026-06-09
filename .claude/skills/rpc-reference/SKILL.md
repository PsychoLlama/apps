---
description: Reference docs for `@lib/messaging` — the codebase's typed, bidirectional RPC over pluggable transports (web workers, MessagePorts, etc.). Load when authoring or reviewing any cross-thread/cross-context messaging, picking an API, wiring a worker boundary, or looking up an RPC type.
---

# Messaging / RPC

- Single entry point: `@lib/messaging` (RPC core) and `@lib/messaging/transport` (transport abstraction + adapters).
- Fully-typed, bidirectional RPC over any `Transport`. Two call styles: `request` (awaits a response) and `notify` (fire-and-forget event).
- An `RPC` endpoint owns its transport's message stream end-to-end — the only thing on the wire is `RpcMessage`.

## Conceptual model

- An endpoint is `RPC<Local, Remote, Options>`:
  - `Local` — the `RpcApi` this peer **implements**. Its handlers serve the remote's calls.
  - `Remote` — the `RpcApi` this peer may **call**.
  - `Options` — the transport's per-send option bag (e.g. transferables). Defaults to `never`.
- The peer on the other end is the mirror: `RPC<Remote, Local, Options>`.
- An `RpcApi` splits procedures by call style:
  ```ts
  interface RpcApi {
    requests?: Record<string, RpcProcedure>; // expect a response
    events?: Record<string, RpcProcedure>; // fire-and-forget
  }
  ```
- A procedure takes **at most one** `params` argument and returns a result. Arity 2+ is rejected by the type system.

## Defining an API — derive, don't restate

Write the handler implementation first, then derive the API type from it with `typeof`/`ReturnType`. The contract can't drift from the code that fulfills it, and the peer imports it **type-only** (erased at build, no bundle coupling).

```ts
// worker/rpc.ts — the worker's implementation IS the source of truth.
const decode = ({ bitmap }: { bitmap: ImageBitmap }): ScanResult | null => {
  /* … */
};

export const api = {
  requests: { decode },
};

export type DecoderApi = typeof api; // contract derived from the impl
```

```ts
// host side — its handlers, and the API derived from them.
const createHostHandlers = (onReady: () => void) => ({
  events: { ready: onReady },
});

export type HostApi = ReturnType<typeof createHostHandlers>;
```

- Keep handlers **params-only** (don't accept the options bag) when you want the derived type to read as a clean procedure contract rather than leaking handler-side parameters into the API.
- Omit a section (`requests` / `events`) the endpoint doesn't expose — don't spell out an empty map. The handler type makes an empty section optional and a populated one required (a declared procedure can't go unhandled).

## Creating an endpoint

- `RPC.from<Local, Remote, Options>(transport, handlers)`: wrap a transport as an endpoint. `handlers` implements `Local`.
- **Named, not `new`** (the constructor is private) because construction isn't inert — it eagerly subscribes to the transport. The factory makes that side effect read as an action at the call site.

```ts
// Host (main thread) end of a worker RPC.
const rpc = RPC.from<HostApi, DecoderApi, SendOptions>(
  new MessagePortTransport<RpcMessage, RpcMessage>(worker),
  createHostHandlers(markReady),
);

// Worker end — the mirror.
const rpc = RPC.from<DecoderApi, HostApi, SendOptions>(transport, api);
```

## Calling

- `request(method, params?, options?)`: call a remote request, await its result.
  - Rejects with `RpcError` if the remote handler throws or the method is unknown to the remote.
  - Throws `RpcClosedError` if this endpoint is closed.
  ```ts
  const result = await rpc.request(
    'decode',
    { bitmap },
    { transfer: [bitmap] },
  );
  ```
- `notify(method, params?, options?)`: fire a remote event. Returns once handed to the transport. Throws `RpcClosedError` if closed.
  ```ts
  rpc.notify('ready');
  ```
- Argument positions are fixed: `params` at index 0, `options` at index 1.
  - No-payload procedure: `request('ping')`, or `request('ping', undefined, opts)` to reach options.
  - Options are only meaningful alongside a payload.
- Requests are correlated to their responses by id — concurrent in-flight requests over a shared endpoint can't cross replies. No per-request ports, no manual bookkeeping.

## Handlers

- **Request handler**: `(params, options) => Result | Promise<Result>`. The `options` bag is mutable — set fields on it (e.g. `options.transfer`) to attach transport send-options to the reply. Return the bare result; no wrapper.
  ```ts
  mint: (_params, options) => {
    const buffer = new ArrayBuffer(8);
    options.transfer = [buffer]; // hand the buffer back zero-copy
    return buffer;
  },
  ```
- **Event handler**: `(...args) => void | Promise<void>`. Fire-and-forget — no caller to reject. A throw (sync or rejected promise) is caught and logged here, not surfaced on the wire.
- Method lookup is restricted to **own properties** (`Object.hasOwn`). Inbound method names may be untrusted, so inherited members (`constructor`, `__proto__`, `toString`, …) never resolve — only declared procedures are reachable.

## Errors

- `RpcError` — a remote request failed (handler threw, or unknown method). Throw it deliberately from a handler for an _expected_ failure (e.g. `throw new RpcError('no access')`); deliberate `RpcError`s aren't logged. Any _other_ thrown value is treated as an internal bug and logged to observability before the message rides back to the caller.
- `RpcClosedError` — the endpoint was closed. Deliberately **not** an `RpcError`: a close is a local lifecycle event, not a remote failure. Retry/log-remote-error code must distinguish the two by type.

## Lifecycle

- `close()`: discard the transport listener and reject every in-flight request with `RpcClosedError`. Idempotent. Afterwards `request`/`notify` throw — sending on a dead endpoint is a bug, not a silent no-op.
- `close()` does **not** own the transport. Closing the underlying carrier is the owner's call — tear both down in order:
  ```ts
  connection.rpc.close(); // reject in-flight requests first…
  connection.worker.terminate(); // …then reclaim the thread.
  ```

## Transports

- `Transport<Inbound, Outbound, Options>`: the base interface every adapter implements.
  ```ts
  interface Transport<Inbound, Outbound, Options = never> {
    send: (message: Outbound, options: Options) => void;
    onMessage: (handler: (message: Inbound) => void) => Unsubscribe;
  }
  ```

  - `send`/`onMessage` are declared as **function-typed properties**, not methods, on purpose — property syntax forces contravariant param checks so `Options` stays sound (a method signature would be checked bivariantly and silently drop options).
  - `onMessage` returns an `Unsubscribe`; multiple handlers may register, each gets every message.
  - An `RPC`'s transport is always `Transport<RpcMessage, RpcMessage, Options>`.
- `MessagePortTransport<Inbound, Outbound>`: adapter for any `MessagePort`-shaped carrier (a `MessagePort`, a `Worker`, or the worker global scope). Its `Options` are `SendOptions`.
  - `SendOptions { transfer?: Transferable[] }` — list objects to hand over by reference (zero-copy); transferred objects are neutered in the sender.
  - Listens via `addEventListener`, so a **`MessagePort` delivers nothing until the consumer `start()`s it** — starting is the consumer's to time. (`Worker` endpoints deliver without starting.)
  ```ts
  const { port1, port2 } = new MessageChannel();
  const transport = new MessagePortTransport<RpcMessage, RpcMessage>(port1);
  port1.start(); // begin delivery when ready
  ```

## Worker boundary pattern

The canonical setup — a host on the main thread, an impl in the worker, each owning its own API:

- The worker module is the source of truth for its handlers and exports `type DecoderApi = typeof api`. Its entry wires `api` onto `RPC.from<DecoderApi, HostApi, SendOptions>(transport, api)`.
- The host derives `HostApi` from `createHostHandlers(...)` and wires `RPC.from<HostApi, DecoderApi, SendOptions>(…)`.
- Each side imports the **other's** API as a type-only import.
- For data that can't cross `postMessage` (wasm handles, class instances), project it to plain structured-clone-safe fields _inside the worker_ before returning.
- Gate the host on a one-shot `ready` event before sending the first request when the worker needs async init (e.g. wasm). The event handler stays registered; a repeat `ready` just re-resolves a settled promise.

## Public API surface

From `@lib/messaging`:

- `RPC` — the endpoint class. Build via `RPC.from(...)`; methods `request`, `notify`, `close`.
- `RpcError`, `RpcClosedError` — the two error classes.
- types: `RpcApi`, `RpcHandlers<Api, Options>`, `RpcMessage`, `RpcProcedure`.

From `@lib/messaging/transport`:

- `Transport<Inbound, Outbound, Options>`, `MessagePortTransport`.
- types/interfaces: `SendOptions`, `MessageEndpoint`, `MessageHandler<Inbound>`, `Unsubscribe`.

## Testing

- Wire two real peers over a `MessageChannel` through the real adapter — no hand-rolled mock transport. `start()` both ports.
- Events are fire-and-forget. To act on ordering, use a round-trip request as a **barrier**: it can't resolve until everything queued before it on the channel has been handled.

```ts
const setup = () => {
  const { port1, port2 } = new MessageChannel();

  const server = RPC.from<ServerApi, ClientApi, SendOptions>(
    new MessagePortTransport(port1),
    {
      requests: { add: ({ left, right }) => left + right },
      events: {
        ping: () => {
          /* … */
        },
      },
    },
  );

  const client = RPC.from<ClientApi, ServerApi, SendOptions>(
    new MessagePortTransport(port2),
    { requests: {}, events: {} },
  );

  port1.start();
  port2.start();

  // A round-trip request as an ordered barrier — flush queued events.
  const flush = () => client.request('add', { left: 0, right: 0 });

  return { server, client, flush };
};

it('resolves a request with the remote handler result', async () => {
  const { client } = setup();
  await expect(client.request('add', { left: 2, right: 3 })).resolves.toBe(5);
});
```

- Assert transfer by checking `byteLength` drops to `0` in the sender after a transferred buffer leaves.
- Co-locate tests under `__tests__/`. Type-level guarantees (routing, arity, optional sections) go in a `type-safety.test.ts` with `expectTypeOf`.
