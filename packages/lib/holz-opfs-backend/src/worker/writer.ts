import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../host-api';
import { createWorkerSink } from './log-sink';
import { createWorkerHandlers, type WorkerApi } from './rpc';

/**
 * The OPFS writer worker entry — a *dedicated* worker the SharedWorker hub
 * spawns (see `./hub.ts`). It exists for one reason: `createSyncAccessHandle`
 * is exposed only in `DedicatedWorker`, so the hub — a `SharedWorker` — can't
 * hold the OPFS handle itself. This worker does, and is the single writer of
 * the one shared log file.
 *
 * It opens the file at boot and serves the same `log`/`flush` contract the hub
 * forwards every tab's logs (and its own) over. Booting the RPC endpoint is a
 * load-time side effect; the hub references this module through a `?worker`
 * import, so it's bundled as its own entry rather than tree-shaken.
 */

// `self` is a `DedicatedWorkerGlobalScope` here (this file's `tsconfig.json`
// types it under the `WebWorker` lib), which satisfies `MessageEndpoint`. A
// dedicated worker delivers messages without `start()`, so none is needed.
const sink = createWorkerSink();
void sink.open();
RPC.from<WorkerApi, HostApi, SendOptions>(
  new MessagePortTransport<RpcMessage, RpcMessage>(self),
  createWorkerHandlers(sink),
);
