import { toJSON } from '@holz/json-backend/marshal';
import { openDatabase } from '@lib/holz-idb-backend/database';
import { createLogger, toError, type Log } from '@lib/observability';
import { LOGS_DATABASE, TIMESTAMP_INDEX } from '@lib/observability/storage';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Newline-delimited JSON: one log per line. */
export const CONTENT_TYPE = 'application/x-ndjson';

export interface LogExportConfig {
  /** Download filename, without the `.ndjson` extension. */
  filename?: string;
}

/**
 * Responds with every log persisted by `@lib/observability` as an ndjson
 * file download, oldest first. Each line is marshalled with
 * `@holz/json-backend`, matching its labelled levels, ISO timestamps, and
 * serialized errors.
 */
export const serveLogExport = ({ filename = 'logs' }: LogExportConfig = {}) => {
  return () => {
    const stream = new ReadableStream<Uint8Array>({
      start: streamLogsFromIdb,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="${filename}.ndjson"`,
      },
    });
  };
};

const streamLogsFromIdb = async (
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> => {
  const encoder = new TextEncoder();
  let db: IDBDatabase | undefined;

  try {
    // Migrate rather than open blindly. An unversioned open on a fresh origin
    // creates an empty database that later migrations skip past.
    db = await openDatabase(LOGS_DATABASE);
    const index = db
      .transaction(LOGS_DATABASE.table)
      .objectStore(LOGS_DATABASE.table)
      .index(TIMESTAMP_INDEX);

    const count = await forEachLog(index, (log) => {
      controller.enqueue(encoder.encode(`${JSON.stringify(toJSON(log))}\n`));
    });

    controller.close();
    logger.info('Logs exported to file.', { count });
  } catch (error) {
    logger.error('Failed to export logs.', { error: toError(error) });
    controller.error(error);
  } finally {
    db?.close();
  }
};

// Walks the index in order, resolving with how many logs it visited. Enqueue
// eagerly instead of waiting on backpressure: IndexedDB commits a transaction
// as soon as it goes idle, which would cut the read short.
const forEachLog = (
  index: IDBIndex,
  visit: (log: Log) => void,
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const request = index.openCursor();
    let count = 0;

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to read logs.'));
    };

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve(count);

      visit(cursor.value as Log);
      count += 1;
      cursor.continue();
    };
  });
};
