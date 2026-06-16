import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../host-api.ts';
import type { WorkerApi } from './rpc.ts';

/**
 * The observability worker. Spawned on the main thread by the OPFS log
 * backend (see `../logging/backends/opfs-worker.ts`). On boot it opens a log
 * file in the origin-private file system, then hands the host the writable end
 * of a stream whose UTF-8 NDJSON chunks it persists to that file.
 */

// The worker global scope is a `MessageEndpoint` as-is — `postMessage(message,
// transfer)` plus `add/removeEventListener`. This file is typed for the worker
// (see `tsconfig.json`), so `self` reads as a `DedicatedWorkerGlobalScope` and
// satisfies the interface with no cast.
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(self);

const rpc = RPC.from<WorkerApi, HostApi, SendOptions>(transport, {});

// A fresh, uniquely named file each boot so sessions never clobber one another,
// even across tabs sharing this origin. `Date.now()` orders the files by
// creation; the random suffix settles same-millisecond collisions. There's no
// cross-thread monotonic clock to lean on instead — `performance.now()` is
// per-worker and coarsened, so it can't guarantee ordering or uniqueness here.
const logFileName = (): string =>
  `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.ndjson`;

const openLogFile = async (): Promise<FileSystemSyncAccessHandle> => {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle('logs', { create: true });
  const file = await dir.getFileHandle(logFileName(), { create: true });
  return file.createSyncAccessHandle();
};

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

// Open the file before announcing: the host attaches its sink to `ready`, so
// holding the event until writes can land avoids dropping logs on the floor.
// (Anything logged before this point is still lost; buffering is later work.)
const boot = async (): Promise<void> => {
  const access = await openLogFile();
  const sink = createLogSink(access);
  rpc.notify('ready', sink, { transfer: [sink] });
};

void boot();
