import { createFlushScheduler } from './flush-scheduler';
import type { WorkerSink } from './rpc';

/**
 * The single grow-only OPFS log file every realm shares, relative to the
 * origin-private file system root. One constant location, owned by the writer
 * worker: it's the single writer of this file, so there's no per-session name
 * to avoid clobbering — every tab funnels into it.
 */
const LOG_DIRECTORY = 'logs';
const LOG_FILE = 'app.ndjson';

/**
 * The single OPFS-backed durable log: one sync access handle, one flush
 * scheduler. Every producer — each connected tab and the hub's own logs —
 * writes whole NDJSON lines through it, so they all share one file and one
 * flush cadence.
 */
interface DurableLog {
  /** Append one NDJSON chunk, recording its size against the flush policy. */
  write: (chunk: Uint8Array) => void;

  /** Force the unflushed tail to disk now. */
  flush: () => void;
}

// Open the single log file and wrap it as the durable log. `createSyncAccessHandle`
// is exposed only in a *dedicated* worker, which is why this runs in the nested
// writer worker rather than the SharedWorker hub (see `./hub.ts`). A scheduler
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

/**
 * Build the writer worker's {@link WorkerSink}: the one durable OPFS file every
 * log source feeds. {@link WorkerSink.open open} opens the file (a constant
 * name the writer owns); {@link WorkerSink.write write} appends the lines the
 * hub forwards — both tabs' logs and the hub's own.
 *
 * `openDurable` is injected so tests can drive the sink without OPFS.
 */
export const createWorkerSink = (
  openDurable: () => Promise<DurableLog> = openDurableLog,
): WorkerSink => {
  // The opened durable, tracked both as a promise (so concurrent opens share
  // one file) and, once resolved, synchronously (so `write`/`flush` can run
  // inline without awaiting a microtask).
  let opening: Promise<DurableLog> | undefined;
  let opened: DurableLog | undefined;

  // Whole NDJSON lines that arrived before the durable finished opening. The
  // writer opens the file at boot, before the hub forwards anything, so this
  // stays small; it exists only to hold a racing line in order rather than drop
  // it.
  const pending: Uint8Array[] = [];

  const ensure = (): Promise<DurableLog> =>
    (opening ??= openDurable().then((durable) => {
      opened = durable;
      // Drain anything queued while the file was opening, in arrival order.
      // This runs before `ensure` resolves, so awaiting `open` guarantees these
      // have landed.
      for (const chunk of pending) durable.write(chunk);
      pending.length = 0;
      return durable;
    }));

  return {
    async open() {
      await ensure();
    },
    write(chunk) {
      // The writer opens the file at boot, so the durable is resolved by the
      // time forwarded log events arrive and writes land inline, in order. A
      // line that still races the open settling queues and drains when it opens.
      if (opened) opened.write(chunk);
      else pending.push(chunk);
    },
    flush() {
      opened?.flush();
    },
  };
};
