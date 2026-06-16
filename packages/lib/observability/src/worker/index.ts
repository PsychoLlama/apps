import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../host-api.ts';
import {
  createWorkerHandlers,
  type LogLocation,
  type WorkerApi,
} from './rpc.ts';

/**
 * The observability worker. Spawned on the main thread by the OPFS log
 * backend (see `../logging/backends/opfs-worker.ts`). It waits for the host's
 * `init` request, opens the named log file in the origin-private file system,
 * then hands back the writable end of a stream whose UTF-8 NDJSON chunks it
 * persists to that file.
 */

// The sink for the host's writes: a transferable `WritableStream` persisting
// each NDJSON chunk to `access`. Flushing per write favors durability over
// throughput — batching is a perf followup. The offset lives here because a
// fresh file starts at zero, so accumulating each write's byte count tracks it
// without re-querying the file size.
const createLogSink = (
  access: FileSystemSyncAccessHandle,
): WritableStream<Uint8Array> => {
  let offset = 0;

  return new WritableStream<Uint8Array>({
    write(chunk) {
      offset += access.write(chunk, { at: offset });
      access.flush();
    },
    close() {
      access.close();
    },
    abort() {
      access.close();
    },
  });
};

// Open the host-named log file and wrap it as the sink the host writes into.
// The host owns the directory and file name (see `LogLocation`), so the worker
// only resolves them against the OPFS root.
const openLogStream = async ({
  directory,
  file,
}: LogLocation): Promise<WritableStream<Uint8Array>> => {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle(directory, { create: true });
  const handle = await dir.getFileHandle(file, { create: true });
  return createLogSink(await handle.createSyncAccessHandle());
};

// The worker global scope is a `MessageEndpoint` as-is — `postMessage(message,
// transfer)` plus `add/removeEventListener`. This file is typed for the worker
// (see `tsconfig.json`), so `self` reads as a `DedicatedWorkerGlobalScope` and
// satisfies the interface with no cast. Subscribing synchronously at boot
// installs the listener before the worker's event loop drains, so the host's
// `init` request — posted while this script was still loading — can't be missed.
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(self);

RPC.from<WorkerApi, HostApi, SendOptions>(
  transport,
  createWorkerHandlers(openLogStream),
);
