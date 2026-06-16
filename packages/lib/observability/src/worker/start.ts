import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  type MessageEndpoint,
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../host-api.ts';
import {
  createWorkerHandlers,
  type LogLocation,
  type WorkerApi,
} from './rpc.ts';

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

/**
 * Boot the observability worker on `scope` — the worker global in production,
 * or a stand-in {@link MessageEndpoint} under test. Subscribing synchronously
 * installs the message listener before the worker's event loop drains, so the
 * host's `init` request — posted while this script was still loading — can't be
 * missed.
 */
export const start = (scope: MessageEndpoint): void => {
  const transport = new MessagePortTransport<RpcMessage, RpcMessage>(scope);
  RPC.from<WorkerApi, HostApi, SendOptions>(
    transport,
    createWorkerHandlers(openLogStream),
  );
};
