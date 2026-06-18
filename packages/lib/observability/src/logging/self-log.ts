import { type NdjsonBuffer, createNdjsonBuffer } from './ndjson-buffer.ts';

let buffer: NdjsonBuffer | undefined;

/**
 * The observability worker's buffer for *its own* logs — the logs emitted by
 * code running inside the worker, as opposed to the main-thread logs shipped
 * over RPC. Its {@link NdjsonBuffer.backend backend} feeds the worker's log
 * processor (see `./processor.browser.ts`); `../worker/log-sink.ts` drains its
 * {@link NdjsonBuffer.readable readable} into the shared durable sink once
 * `init` opens the log file, so the worker's logs land in the same file, on
 * the same flush cadence, as the main thread's.
 *
 * Built lazily and memoized: the two sides (the processor and the sink) reach
 * the same instance, and any realm that never persists worker logs (the main
 * thread, other workers) constructs nothing.
 */
export const getSelfLog = (): NdjsonBuffer => (buffer ??= createNdjsonBuffer());
