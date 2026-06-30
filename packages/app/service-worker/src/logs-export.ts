/**
 * `/api/local/logs` — stream the persisted holz log archive as an ndjson
 * download. Kept beside `fetch-handler` so the streaming + IndexedDB plumbing
 * stays out of the dispatch path and can be exercised on its own.
 */

import {
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
} from '@lib/holz-idb-backend/database';
import { createLogger, toError } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** MIME type for newline-delimited JSON — one log object per line. */
export const NDJSON_CONTENT_TYPE = 'application/x-ndjson';

/** Filename the browser offers when saving the streamed archive. */
const DOWNLOAD_FILENAME = 'logs.ndjson';

/**
 * Build a streaming ndjson response over the whole log archive, oldest-first.
 * The body is a `ReadableStream` fed by a single IndexedDB cursor walk: each
 * log is encoded as its own JSON line as the cursor advances, so the archive
 * never has to be fully materialized before the download begins. The
 * `Content-Disposition` header turns a plain navigation to the route into a
 * file save.
 */
export const streamLogArchive = (): Response => {
  const stream = new ReadableStream<Uint8Array>({ start: drainArchive });

  return new Response(stream, {
    headers: {
      'Content-Type': NDJSON_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename="${DOWNLOAD_FILENAME}"`,
    },
  });
};

/**
 * Walk the timestamp index front-to-back with the default `'next'` cursor —
 * chronological, oldest-first — encoding each log as an ndjson line. Owns the
 * connection end to end: opens a reconnecting read (the writing backend owns
 * the schema version) and closes it once the walk drains or fails.
 *
 * The walk runs to completion here rather than pull-by-pull because an
 * IndexedDB transaction stays alive only while it's continuously driven —
 * awaiting stream backpressure between cursor steps would let the transaction
 * auto-close mid-read. The browser drains queued lines as it writes them to
 * disk, so the stream's buffer doesn't grow unbounded in practice.
 */
const drainArchive = async (
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> => {
  const encoder = new TextEncoder();
  const db = await openLogDatabase();

  try {
    const index = db.transaction(STORE_NAME).store.index(TIMESTAMP_INDEX);

    // `idb` makes the cursor async-iterable, advancing it each turn — the
    // default `'next'` direction drains the index oldest-first.
    for await (const cursor of index.iterate()) {
      controller.enqueue(encoder.encode(`${JSON.stringify(cursor.value)}\n`));
    }

    controller.close();
  } catch (error) {
    logger.error('Failed to stream the log archive.', {
      error: toError(error),
    });
    controller.error(error);
  } finally {
    db.close();
  }
};
