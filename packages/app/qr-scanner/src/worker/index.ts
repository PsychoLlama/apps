import { RPC, type RpcMessage } from '@lib/messaging';
import {
  MessagePortTransport,
  type MessageEndpoint,
  type SendOptions,
} from '@lib/messaging/transport';
import * as handlers from './rpc';
import type { DecoderApi, HostApi } from './rpc';

// `MessagePortTransport` drives any `MessageEndpoint`, and the worker global
// scope is one at runtime: `postMessage(message, transfer)` plus
// `add/removeEventListener`. The cast is only to satisfy the type checker —
// this package is typed for the DOM, so `self` reads as a `Window`, whose
// `postMessage(message, targetOrigin, …)` overload doesn't match. Removing it
// needs a worker-typed lib for `*.worker.ts` (tracked as a followup).
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(
  self as MessageEndpoint,
);

const rpc = RPC.from<DecoderApi, HostApi, SendOptions>(transport, {
  requests: { decode: handlers.decode },
});

// Announce readiness so the main thread can start handing us frames. It
// awaits this `ready` event before sending the first `decode`.
void handlers.ready.then(() => rpc.notify('ready'));
