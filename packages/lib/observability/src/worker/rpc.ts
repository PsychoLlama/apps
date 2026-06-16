import { defineContract } from '@lib/messaging/rpc';
import type { SendOptions } from '@lib/messaging/message-port';

/**
 * Where the worker should persist a session's logs: a `file` inside a
 * `directory`, both relative to the origin-private file system root. The host
 * owns both values — it derives a unique file name and picks the directory —
 * and hands them over in the `init` request (see {@link createWorkerHandlers}).
 */
export interface LogLocation {
  directory: string;
  file: string;
}

/**
 * Build the worker's RPC handlers — the observability worker's end of the
 * boundary (see `../logging/backends/opfs-worker.ts`). The host calls `init`
 * once with where to write; the worker opens that file and replies with the
 * writable end of a stream whose UTF-8 NDJSON chunks it persists there.
 *
 * `openLogStream` is injected rather than wired here so this module stays a
 * pure RPC contract, free of the OPFS runtime it would otherwise drag in — the
 * host imports {@link WorkerApi} from here to type its `request('init', …)`,
 * and a type-only import shouldn't reach into `navigator.storage`.
 *
 * {@link WorkerApi} is derived from what this returns (via {@link
 * defineContract}), so the contract tracks the implementation — the worker-side
 * mirror of how the host derives its {@link HostApi} from the value it serves.
 */
export const createWorkerHandlers = (
  openLogStream: (location: LogLocation) => Promise<WritableStream<Uint8Array>>,
) =>
  defineContract<SendOptions>()({
    requests: {
      // Open the log file and transfer the writable end back with the reply, so
      // the host pipes straight into the worker's OPFS-backed sink.
      init: async (location: LogLocation, options) => {
        const stream = await openLogStream(location);
        options.transfer = [stream];
        return stream;
      },
    },
  });

/**
 * The worker's RPC surface, as seen by the host — a single `init` request
 * carrying a {@link LogLocation} and replying with the worker's writable log
 * stream. Derived from {@link createWorkerHandlers} rather than restated by
 * hand, so the contract can't drift from the handler that serves it.
 */
export type WorkerApi = ReturnType<typeof createWorkerHandlers>;
