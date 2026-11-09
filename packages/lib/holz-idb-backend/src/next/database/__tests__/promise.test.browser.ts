import { promisifyRequest } from '../promise';
import { openDatabaseContext } from '../testing';

describe('promisifyRequest', () => {
  it('resolves with the result of the request', async () => {
    await using context = await openDatabaseContext();
    const { database, schema } = context;
    const store = database
      .transaction(schema.table, 'readwrite')
      .objectStore(schema.table);

    store.add('value', 'key');

    await expect(promisifyRequest(store.get('key'))).resolves.toBe('value');
  });

  it('rejects with the error of the request', async () => {
    await using context = await openDatabaseContext();
    const { database, schema } = context;
    const store = database
      .transaction(schema.table, 'readwrite')
      .objectStore(schema.table);

    store.add('value', 'key');

    await expect(
      promisifyRequest(store.add('duplicate', 'key')),
    ).rejects.toMatchObject({ name: 'ConstraintError' });
  });

  it('rejects with a fallback when the request has no error', async () => {
    const request = { error: null } as IDBRequest;
    const result = promisifyRequest(request);

    request.onerror?.(new Event('error'));

    await expect(result).rejects.toMatchObject({
      message: 'IndexedDB request failed.',
      cause: request,
    });
  });
});
