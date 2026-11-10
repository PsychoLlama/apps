import { level, type Log } from '@holz/core';

import { getMigrations, type Schema } from '../database';
import { openOrUpgrade } from '../database/open';
import { promisifyRequest } from '../database/promise';
import { createSchemaContext } from '../database/testing';
import { createIdbBackend } from '../idb-backend';

const createLog = (message: string, overrides: Partial<Log> = {}): Log => ({
  timestamp: 0,
  level: level.info,
  origin: [],
  message,
  context: {},
  ...overrides,
});

/** Declare after the schema context, so it stops before the database goes. */
const startBackend = (schema: Schema, size = 1) => {
  const onError = vi.fn<(error: unknown) => void>();
  const backend = createIdbBackend({
    db: schema,
    batch: { size },
    retain: Infinity,
    onError,
  });

  return { ...backend, onError, [Symbol.dispose]: backend.close };
};

const readLogs = async (schema: Schema): Promise<Log[]> => {
  const database = await openOrUpgrade(schema.name, getMigrations(schema));

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

const waitForLogs = (schema: Schema, logs: Log[]) =>
  vi.waitFor(async () => {
    await expect(readLogs(schema)).resolves.toEqual(logs);
  });

describe('createIdbBackend', () => {
  it('persists logs received before the database opens', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema);
    const logs = [createLog('first'), createLog('second')];

    logs.forEach((log) => backend.processor(log));

    await waitForLogs(context.schema, logs);
    expect(backend.onError).not.toHaveBeenCalled();
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

  it('writes only full batches', async () => {
    await using context = createSchemaContext();
    using backend = startBackend(context.schema, 2);
    const batch = [createLog('first'), createLog('second')];

    [...batch, createLog('partial')].forEach((log) => backend.processor(log));

    await waitForLogs(context.schema, batch);
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
    const logs = [createLog('first'), createLog('second'), createLog('third')];

    logs.forEach((log) => backend.processor(log));
    await waitForLogs(context.schema, logs.slice(0, 2));

    backend.close();

    await waitForLogs(context.schema, logs);
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
