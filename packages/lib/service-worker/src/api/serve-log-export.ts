import {
  STORE_NAME,
  TIMESTAMP_INDEX,
  connectToLogDatabase,
  type LogConnection,
} from '@lib/holz-idb-backend/database';
import { createLogger, toError } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Newline-delimited JSON: one log per line. */
export const CONTENT_TYPE = 'application/x-ndjson';

export interface LogExportConfig {
  /** Download filename, without the `.ndjson` extension. */
  filename: string;
}

/**
 * Responds with every log persisted by `@lib/holz-idb-backend` as an ndjson
 * file download, oldest first.
 */
export const serveLogExport = ({ filename }: LogExportConfig) => {
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
  let db: LogConnection | undefined;

  try {
    // Migrate rather than open blindly. An unversioned open on a fresh origin
    // creates an empty database that later migrations skip past.
    db = await connectToLogDatabase();
    const index = db.transaction(STORE_NAME).store.index(TIMESTAMP_INDEX);

    // Enqueue eagerly instead of waiting on backpressure. IndexedDB commits
    // a transaction as soon as it goes idle, which would cut the read short.
    for await (const cursor of index.iterate()) {
      controller.enqueue(encoder.encode(`${JSON.stringify(cursor.value)}\n`));
    }

    controller.close();
  } catch (error) {
    logger.error('Failed to export logs.', { error: toError(error) });
    controller.error(error);
  } finally {
    db?.close();
  }
};
