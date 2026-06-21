import { createFlushScheduler } from './flush-scheduler.ts';
import type { NdjsonBuffer } from '../ndjson-buffer.ts';
import { getWorkerLogBuffer } from './worker-log-buffer.ts';
import type { LogLocation, WorkerSink } from './rpc.ts';

/**
 * The single OPFS-backed durable log for a session: one sync access handle,
 * one flush scheduler. Every producer — the host, this worker's own logs, and
 * (eventually) other workers — writes whole NDJSON lines through it, so they
 * all share one file and one flush cadence.
 */
interface DurableLog {
  /** Append one NDJSON chunk, recording its size against the flush policy. */
  write: (chunk: Uint8Array) => void;

  /** Force the unflushed tail to disk now. */
  flush: () => void;
}

// Open the host-named log file and wrap it as the session's durable log. The
// host owns the directory and file name (see `LogLocation`), so the worker only
// resolves them against the OPFS root. A scheduler batches the expensive
// `flush()` by size and time; each write goes straight to `access` so readers
// see current data.
const openDurableLog = async ({
  directory,
  file,
}: LogLocation): Promise<DurableLog> => {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle(directory, { create: true });
  const handle = await dir.getFileHandle(file, { create: true });
  const access = await handle.createSyncAccessHandle();
  const scheduler = createFlushScheduler(() => access.flush());

  return {
    write(chunk) {
      access.write(chunk);
      scheduler.record(chunk.byteLength);
    },
    flush: () => scheduler.flush(),
  };
};

// Wrap a `DurableLog` as a fresh `WritableStream` producer. Mint one per
// source. Whole-line NDJSON chunks from concurrent producers can't tear:
// `access.write` is synchronous and the worker runs one thread, so each chunk
// lands in full before the next begins. Producer `close`/`abort` deliberately
// do nothing to the durable log — other producers keep writing, and the file's
// lifetime is the worker's (the page going away tears both down).
const producerStream = (durable: DurableLog): WritableStream<Uint8Array> =>
  new WritableStream({
    write(chunk) {
      durable.write(chunk);
    },
  });

/**
 * Build the worker's {@link WorkerSink}: one durable OPFS file fed by many
 * producers. The first {@link WorkerSink.open open} opens the file (the host
 * owns its name, delivered in `init`) and tees this worker's own logs in;
 * every `open` mints a producer to transfer back to a caller. The sink opens
 * lazily because the file name only arrives with `init`.
 *
 * `openDurable` and `getBuffer` are injected so tests can drive the sink
 * without OPFS or the module-level buffer singleton.
 */
export const createWorkerSink = (
  openDurable: (location: LogLocation) => Promise<DurableLog> = openDurableLog,
  getBuffer: () => NdjsonBuffer = getWorkerLogBuffer,
): WorkerSink => {
  // The opened durable, tracked both as a promise (so concurrent opens share
  // one file) and, once resolved, synchronously (so `flush` can run inline on
  // the page-hidden beat without awaiting a microtask).
  let opening: Promise<DurableLog> | undefined;
  let opened: DurableLog | undefined;

  const ensure = (location: LogLocation): Promise<DurableLog> =>
    (opening ??= openDurable(location).then((durable) => {
      opened = durable;
      // Tee this worker's own logs into the same durable sink. Its buffer has
      // been absorbing them since boot (see `./worker-log-buffer.ts`);
      // drain it now that the file is open.
      void getBuffer().readable.pipeTo(producerStream(durable));
      return durable;
    }));

  return {
    async open(location) {
      return producerStream(await ensure(location));
    },
    flush() {
      opened?.flush();
    },
  };
};
