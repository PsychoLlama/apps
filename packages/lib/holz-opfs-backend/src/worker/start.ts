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
 * Boot the observability worker on `scope` — the worker global in production,
 * or a stand-in {@link MessageEndpoint} under test. Subscribing synchronously
 * installs the message listener before the worker's event loop drains, so the
 * host's `init` request — posted while this script was still loading — can't be
 * missed.
 *
 * The handlers serve a {@link createWorkerSink durable log sink} that the host
 * writes into and that the worker's own logs tee into, so both land in one
 * file on one flush cadence.
 */
export const start = (scope: MessageEndpoint): void => {
  const transport = new MessagePortTransport<RpcMessage, RpcMessage>(scope);
  RPC.from<WorkerApi, HostApi, SendOptions>(
    transport,
    createWorkerHandlers(createWorkerSink()),
  );
};
