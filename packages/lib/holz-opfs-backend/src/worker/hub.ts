import { RPC, type RpcMessage, defineContract } from '@lib/messaging/rpc';
import {
  type MessageEndpoint,
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../host-api';
import { streamLogs } from '../log-stream';
import { getWorkerLogBuffer } from './worker-log-buffer';
import type { WorkerApi } from './rpc';

/**
 * Handlers the hub serves to each connected tab: forward its `log`/`flush`
 * events straight into the single `writer` RPC. The hub is a pure relay — it
 * never touches OPFS (a `SharedWorker` can't; see `./writer.ts`), only fans
 * every tab's stream into the one writer.
 *
 * The forwarded chunk's buffer is transferred onward, not copied: it reached
 * the hub by transfer from the tab, so the hub owns it outright and never
 * reads it again — a zero-copy relay.
 */
const createRelayHandlers = (writer: RPC<HostApi, WorkerApi, SendOptions>) =>
  defineContract<SendOptions>()({
    requests: {},
    events: {
      log: (chunk: Uint8Array) =>
        writer.notify('log', chunk, { transfer: [chunk.buffer] }),
      flush: () => writer.notify('flush'),
    },
  });

/**
 * Boot the SharedWorker hub against its `writer` worker and return a
 * per-connection binder. A {@link SharedWorker} fans every tab in through
 * `onconnect`, one {@link MessageEndpoint} per tab; the returned function binds
 * each to its own RPC that relays into the one `writer`, so every tab's logs —
 * plus the hub's own — land in a single OPFS file the writer owns.
 *
 * The hub's own logs (emitted by `@lib/messaging` and anything else loaded
 * here, captured because this realm is the observability worker) stream to the
 * writer too: `ownLogs` is the hub's log buffer, drained the same way the main
 * thread drains a tab's. It's injected so tests can drive the hub without the
 * module-level buffer singleton.
 */
export const startHub = (
  writer: MessageEndpoint,
  ownLogs: ReadableStream<Uint8Array> = getWorkerLogBuffer().readable,
): ((port: MessageEndpoint) => void) => {
  // The host end of the hub→writer boundary. The hub serves the writer nothing;
  // it only forwards `log`/`flush`. A dedicated `Worker` delivers without
  // `start()`, so the writer endpoint needs none.
  const writerRpc = RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(writer),
    {},
  );

  // Stream the hub's own logs into the writer. The writer's sink queues
  // anything that beats its file open, so this can start immediately.
  void streamLogs(ownLogs, writerRpc);

  // One RPC per connected tab, all relaying into the same writer. The relay
  // handlers are stateless, so sharing them across ports is safe.
  const relay = createRelayHandlers(writerRpc);
  return (port) => {
    const transport = new MessagePortTransport<RpcMessage, RpcMessage>(port);
    RPC.from<WorkerApi, HostApi, SendOptions>(transport, relay);
  };
};
