import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  type MessageEndpoint,
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../host-api';
import { createWorkerSink } from './log-sink';
import { createWorkerHandlers, type WorkerApi } from './rpc';

/**
 * Boot the observability worker's shared sink and return a per-connection
 * binder. A {@link SharedWorker} fans every tab in through `onconnect`, one
 * {@link MessageEndpoint} (a `MessagePort`) per tab; the returned function
 * binds each to its own RPC over the one shared {@link createWorkerSink sink},
 * so every tab's logs — plus the worker's own — land in a single OPFS file on
 * one flush cadence.
 *
 * Opening the sink here, before any port binds, means the file is opening the
 * instant the worker loads; log events that beat it queue in the sink and drain
 * in order once it's open. The `sink` is injected so tests can drive the binder
 * without OPFS.
 */
export const start = (
  sink = createWorkerSink(),
): ((port: MessageEndpoint) => void) => {
  void sink.open();
  const handlers = createWorkerHandlers(sink);

  // One RPC per connected tab, all serving the same handlers — and so the same
  // sink. The handlers are stateless (they only delegate to the sink), so
  // sharing them across ports is safe.
  return (port) => {
    const transport = new MessagePortTransport<RpcMessage, RpcMessage>(port);
    RPC.from<WorkerApi, HostApi, SendOptions>(transport, handlers);
  };
};
