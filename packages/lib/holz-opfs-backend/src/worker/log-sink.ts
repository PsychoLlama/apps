import { createFlushScheduler } from './flush-scheduler';
import type { NdjsonBuffer } from '../ndjson-buffer';
import { getWorkerLogBuffer } from './worker-log-buffer';
import type { WorkerSink } from './rpc';

/**
 * The single grow-only OPFS log file every realm shares, relative to the
 * origin-private file system root. One constant location, owned by the worker:
 * the {@link SharedWorker} is itself the single writer, so there's no
 * per-session name to avoid clobbering — every tab funnels into this one file.
 */
const LOG_DIRECTORY = 'logs';
const LOG_FILE = 'app.ndjson';

/**
 * The single OPFS-backed durable log: one sync access handle, one flush
 * scheduler. Every producer — each connected tab and this worker's own logs —
 * writes whole NDJSON lines through it, so they all share one file and one
 * flush cadence.
 */
interface DurableLog {
  /** Append one NDJSON chunk, recording its size against the flush policy. */
  write: (chunk: Uint8Array) => void;

  /** Force the unflushed tail to disk now. */
  flush: () => void;
}

// Open the worker's single log file and wrap it as the durable log. A scheduler
// batches the expensive `flush()` by size and time; each write goes straight to
// `access` so readers see current data. The handle is truncated on open: it's
// grow-only only within a worker's lifetime, so a fresh boot starts the file
// clean rather than overwriting a longer prior tail into a torn NDJSON stream.
const openDurableLog = async (): Promise<DurableLog> => {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle(LOG_DIRECTORY, { create: true });
  const handle = await dir.getFileHandle(LOG_FILE, { create: true });
  const access = await handle.createSyncAccessHandle();
  access.truncate(0);
  const scheduler = createFlushScheduler(() => access.flush());

  return {
    write(chunk) {
      access.write(chunk);
      scheduler.record(chunk.byteLength);
    },
    flush: () => scheduler.flush(),
  };
};

// Drain a `ReadableStream` of whole NDJSON lines into a `DurableLog`. Used for
// the worker's own logs, whose buffer has been absorbing them since boot.
// Whole-line chunks can't tear: `access.write` is synchronous and the worker
// runs one thread, so each chunk lands in full before the next begins. The
// stream `close`/`abort` deliberately do nothing to the durable log — its
// lifetime is the worker's (the page going away tears both down).
const drainInto = (durable: DurableLog): WritableStream<Uint8Array> =>
  new WritableStream({
    write(chunk) {
      durable.write(chunk);
    },
  });

/**
 * Build the worker's {@link WorkerSink}: one durable OPFS file fed by every log
 * source. {@link WorkerSink.open open} opens the file (the worker's own
 * constant name) and tees this worker's own logs in; {@link WorkerSink.write
 * write} appends the lines streamed in from connected tabs.
 *
 * `openDurable` and `getBuffer` are injected so tests can drive the sink
 * without OPFS or the module-level buffer singleton.
 */
export const createWorkerSink = (
  openDurable: () => Promise<DurableLog> = openDurableLog,
  getBuffer: () => NdjsonBuffer = getWorkerLogBuffer,
): WorkerSink => {
  // The opened durable, tracked both as a promise (so concurrent opens share
  // one file) and, once resolved, synchronously (so `write`/`flush` can run
  // inline without awaiting a microtask).
  let opening: Promise<DurableLog> | undefined;
  let opened: DurableLog | undefined;

  // Whole NDJSON lines that arrived before the durable finished opening. The
  // worker opens the file at boot, before any tab connects, so this stays
  // small; it exists only to hold a racing line in order rather than drop it.
  const pending: Uint8Array[] = [];

  const ensure = (): Promise<DurableLog> =>
    (opening ??= openDurable().then((durable) => {
      opened = durable;
      // Drain anything queued while the file was opening, in arrival order,
      // before the worker's own log tee starts. This runs before `ensure`
      // resolves, so awaiting `open` guarantees these have landed.
      for (const chunk of pending) durable.write(chunk);
      pending.length = 0;
      // Tee this worker's own logs into the same durable sink. Its buffer has
      // been absorbing them since boot (see `./worker-log-buffer.ts`);
      // drain it now that the file is open.
      void getBuffer().readable.pipeTo(drainInto(durable));
      return durable;
    }));

  return {
    async open() {
      await ensure();
    },
    write(chunk) {
      // The worker opens the file at boot, so the durable is resolved by the
      // time tabs' log events arrive and writes land inline, in order. A line
      // that still races the open settling queues and drains when it opens.
      if (opened) opened.write(chunk);
      else pending.push(chunk);
    },
    flush() {
      opened?.flush();
    },
  };
};
