/**
 * The origin-private file system directory the observability worker writes
 * session log files into, relative to the OPFS root.
 */
export const LOG_DIRECTORY = 'logs';

/**
 * This session's log file name, unique so tabs sharing the origin never clobber
 * one another. The `Date.now()` prefix orders files by creation; the random
 * suffix settles same-millisecond collisions.
 *
 * Computed once at module load, so every reader sees the same name for the
 * session's lifetime — the main thread derives it (it owns the wall clock and
 * `crypto`) and hands it to the worker.
 */
export const LOG_FILE_NAME = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.ndjson`;
