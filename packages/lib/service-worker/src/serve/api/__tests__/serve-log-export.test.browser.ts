import { toJSON } from '@holz/json-backend/marshal';
import {
  STORE_NAME,
  deleteLogDatabase,
  migrateLogDatabase,
} from '@lib/holz-idb-backend/database';
import { level, type Log } from '@lib/observability';

import { CONTENT_TYPE, serveLogExport } from '../serve-log-export';

describe('serveLogExport', () => {
  const exportLogs = serveLogExport({ filename: 'debug-logs' });

  const ndjson = {
    parse: (body: string): unknown[] =>
      body
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line): unknown => JSON.parse(line)),
  };

  // What a log looks like after a trip through the export.
  const exported = (log: Log): unknown =>
    JSON.parse(JSON.stringify(toJSON(log)));

  const createLog = (overrides: Partial<Log>): Log => ({
    timestamp: 0,
    message: '',
    level: level.info,
    origin: [],
    context: {},
    ...overrides,
  });

  const setup = async () => {
    const db = await migrateLogDatabase();

    return {
      db,

      seed: async (overrides: Partial<Log>[]): Promise<Log[]> => {
        const logs = overrides.map(createLog);
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await Promise.all([...logs.map((log) => tx.store.add(log)), tx.done]);

        return logs;
      },

      [Symbol.asyncDispose]: async () => {
        db.close();
        await deleteLogDatabase();
      },
    };
  };

  it('exports logs as an ndjson download, oldest-first', async () => {
    await using handle = await setup();

    // Inserted out of order to prove sorting comes from the timestamp.
    const [newer, older] = await handle.seed([
      { message: 'newer', timestamp: 2000 },
      { message: 'older', timestamp: 1000 },
    ]);

    const response = exportLogs();
    expect(response.headers.get('Content-Type')).toBe(CONTENT_TYPE);
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="debug-logs.ndjson"',
    );

    expect(ndjson.parse(await response.text())).toEqual(
      [older, newer].map(exported),
    );
  });

  it('exports an empty body before the database exists', async () => {
    const response = serveLogExport()();
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="logs.ndjson"',
    );

    await expect(response.text()).resolves.toBe('');

    // The export must not leave behind a schema that migrations skip.
    await using handle = await setup();
    expect(handle.db.objectStoreNames.contains(STORE_NAME)).toBe(true);
  });
});
