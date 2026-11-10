import { level, type Log } from '@holz/core';

import { insert } from '../insert';
import { promisifyRequest } from '../promise';
import { openDatabaseContext, type DatabaseContext } from '../testing';

const createLog = (overrides: Partial<Log> = {}): Log => ({
  timestamp: 0,
  level: level.info,
  origin: [],
  message: 'message',
  context: {},
  ...overrides,
});

const readLogs = ({ database, schema }: DatabaseContext): Promise<Log[]> =>
  promisifyRequest(
    database
      .transaction(schema.table)
      .objectStore(schema.table)
      .getAll() as IDBRequest<Log[]>,
  );

describe('insert', () => {
  it('writes every log in order', async () => {
    await using context = await openDatabaseContext();
    const logs = [createLog({ message: 'a' }), createLog({ message: 'b' })];

    await insert(context.database, context.schema.table, logs);

    await expect(readLogs(context)).resolves.toEqual(logs);
  });

  it('resolves for an empty batch', async () => {
    await using context = await openDatabaseContext();

    await insert(context.database, context.schema.table, []);

    await expect(readLogs(context)).resolves.toEqual([]);
  });

  it('rejects when the table does not exist', async () => {
    await using context = await openDatabaseContext();

    await expect(
      insert(context.database, 'missing', [createLog()]),
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });
});
