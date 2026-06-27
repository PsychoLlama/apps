import { createFlushScheduler } from './flush-scheduler';
import type { NdjsonBuffer } from '../ndjson-buffer';
import { getWorkerLogBuffer } from './worker-log-buffer';
import type { LogLocation, WorkerSink } from './rpc';

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
 * source. {@link WorkerSink.open open} opens the file (the host owns its name,
 * delivered in `init`) and tees this worker's own logs in; {@link
 * WorkerSink.write write} appends the host's streamed lines. The sink opens
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
  // one file) and, once resolved, synchronously (so `write`/`flush` can run
  // inline without awaiting a microtask).
  let opening: Promise<DurableLog> | undefined;
  let opened: DurableLog | undefined;

  // Whole NDJSON lines that arrived before the durable finished opening. In
  // practice the host awaits `init` before streaming, so this stays empty; it
  // exists only to hold a racing line in order rather than drop it.
  const pending: Uint8Array[] = [];

  const ensure = (location: LogLocation): Promise<DurableLog> =>
    (opening ??= openDurable(location).then((durable) => {
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
    async open(location) {
      await ensure(location);
    },
    write(chunk) {
      // The host awaits `open` before streaming, so the durable is resolved by
      // the time its log events arrive and writes land inline, in order. A line
      // that still races the open settling queues and drains when it opens.
      if (opened) opened.write(chunk);
      else pending.push(chunk);
    },
    flush() {
      opened?.flush();
    },
  };
};
