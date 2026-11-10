import { level, type Log } from '@holz/core';

import { getMigrations, type DatabaseConfig } from '../database/internal';
import { openCurrent } from '../database/open';
import { promisifyRequest } from '../database/promise';
import { deleteDatabase } from '../database/delete-database';
import { createSchemaContext } from '../database/testing';
import { createIdbBackend, type IdbBackendConfig } from '../idb-backend';

const createLog = (message: string, overrides: Partial<Log> = {}): Log => ({
  timestamp: 0,
  level: level.info,
  origin: [],
  message,
  context: {},
  ...overrides,
});

/** Declare after the schema context, so it stops before the database goes. */
const startBackend = (
  schema: DatabaseConfig,
  size = 1,
  overrides: Partial<IdbBackendConfig> = {},
) => {
  const onError = vi.fn<(error: unknown) => void>();
  const backend = createIdbBackend({
    db: schema,
    batch: { size },
    retain: Infinity,
    onError,
    ...overrides,
  });

  return { ...backend, onError, [Symbol.dispose]: backend.close };
};

const openDatabase = (schema: DatabaseConfig) =>
  openCurrent(schema.name, getMigrations(schema));

const readLogs = async (schema: DatabaseConfig): Promise<Log[]> => {
  const database = await openDatabase(schema);

  try {
    return await promisifyRequest(
      database
        .transaction(schema.table)
        .objectStore(schema.table)
        .getAll() as IDBRequest<Log[]>,
    );
  } finally {
    database.close();
  }
};

const waitForLogs = (schema: DatabaseConfig, logs: Log[]) =>
  vi.waitFor(async () => {
    await expect(readLogs(schema)).resolves.toEqual(logs);
  });

/**
 * Logs received before the database opens skip batching, so write one and
 * wait for it to land. Returns it, since it's in the database now.
 */
const waitForConnection = async (
  backend: ReturnType<typeof startBackend>,
  schema: DatabaseConfig,
): Promise<Log> => {
  const ready = createLog('ready');

  backend.processor(ready);
  await waitForLogs(schema, [ready]);

  return ready;
};

describe('createIdbBackend', () => {
  it('persists logs received before the database opens', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema);
    const logs = [createLog('first'), createLog('second')];

    logs.forEach((log) => backend.processor(log));

    await waitForLogs(context.schema, logs);
    expect(backend.onError).not.toHaveBeenCalled();
  });

  it('writes logs received before the database opens in one transaction', async () => {
    await using context = createSchemaContext();
    using transaction = vi.spyOn(IDBDatabase.prototype, 'transaction');
    using backend = startBackend(context.schema);
    const logs = [createLog('first'), createLog('second'), createLog('third')];

    logs.forEach((log) => backend.processor(log));
    await waitForLogs(context.schema, logs);

    const writes = transaction.mock.calls.filter(
      ([, mode]) => mode === 'readwrite',
    );

    expect(writes).toHaveLength(1);
  });

  it('persists logs received after the database opens', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema);
    const first = createLog('first');
    const second = createLog('second');

    backend.processor(first);
    await waitForLogs(context.schema, [first]);

    backend.processor(second);
    await waitForLogs(context.schema, [first, second]);
  });

  it('writes only full batches once connected', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema, 2);
    const ready = await waitForConnection(backend, context.schema);
    const batch = [createLog('first'), createLog('second')];

    [...batch, createLog('partial')].forEach((log) => backend.processor(log));

    await waitForLogs(context.schema, [ready, ...batch]);
  });

  it('keeps persisting after the database is deleted', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema);
    const first = createLog('first');
    const second = createLog('second');

    backend.processor(first);
    await waitForLogs(context.schema, [first]);

    await deleteDatabase(context.schema.name);
    backend.processor(second);

    await waitForLogs(context.schema, [second]);
    expect(backend.onError).not.toHaveBeenCalled();
  });

  it('keeps the pending batch in order across a reconnect', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema, 2);
    await waitForConnection(backend, context.schema);
    const pending = createLog('pending');
    const later = [createLog('second'), createLog('third')];

    backend.processor(pending); // Half a batch.
    await deleteDatabase(context.schema.name);

    // Whether these arrive before or after reconnecting, they belong after
    // the pending log.
    later.forEach((log) => backend.processor(log));

    await waitForLogs(context.schema, [pending, ...later]);
    expect(backend.onError).not.toHaveBeenCalled();
  });

  it('runs custom migrations after the defaults', async () => {
    await using context = createSchemaContext();
    const { table } = context.schema;
    using backend = startBackend(context.schema, 1, {
      migrations: (defaults) => [
        ...defaults,
        {
          name: 'by-level',
          run: (transaction) =>
            void transaction
              .objectStore(table)
              .createIndex('by-level', 'level'),
        },
      ],
    });
    const log = createLog('first');

    backend.processor(log);
    await waitForLogs(context.schema, [log]);

    const database = await openDatabase(context.schema);
    const { indexNames } = database.transaction(table).objectStore(table);
    database.close();

    expect(database.version).toBe(2);
    expect([...indexNames]).toContain('by-level');
  });

  it('rejects unknown default migration names', () => {
    const customize: IdbBackendConfig['migrations'] = (defaults) => {
      // @ts-expect-error Not a migration we ship.
      defaults.findIndex((migration) => migration.name === 'intt');

      return defaults;
    };

    expectTypeOf(customize).not.toBeUndefined();
  });

  it('discards logs received after closing', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema);
    const first = createLog('first');

    backend.processor(first);
    await waitForLogs(context.schema, [first]);

    backend.close();
    backend.processor(createLog('late'));

    await expect(readLogs(context.schema)).resolves.toEqual([first]);
  });

  it('writes the pending batch when closing', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema, 2);
    const ready = await waitForConnection(backend, context.schema);
    const pending = createLog('pending');

    backend.processor(pending);
    backend.close();

    await waitForLogs(context.schema, [ready, pending]);
  });

  it('writes the pending batch when flushed', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema, 2);
    const ready = await waitForConnection(backend, context.schema);
    const pending = createLog('pending');

    backend.processor(pending);
    await expect(readLogs(context.schema)).resolves.toEqual([ready]);

    backend.flush();

    await waitForLogs(context.schema, [ready, pending]);
  });

  it('keeps persisting after a flush', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema);
    const first = createLog('first');
    const second = createLog('second');

    backend.flush(); // Before the database opens.
    backend.processor(first);
    await waitForLogs(context.schema, [first]);

    backend.flush();
    backend.processor(second);
    await waitForLogs(context.schema, [first, second]);
    expect(backend.onError).not.toHaveBeenCalled();
  });

  it('reports a batch that fails to write', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema);

    backend.processor(
      createLog('uncloneable', {
        context: { uncloneable: () => {} } as unknown as Log['context'],
      }),
    );

    await vi.waitFor(() =>
      expect(backend.onError).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'DataCloneError' }),
      ),
    );
  });
});
