import { getMigrations } from '../migrations';
import { createSchemaContext, openDatabaseContext } from '../testing';

describe('getMigrations', () => {
  it('gives every migration a unique name', async () => {
    await using context = createSchemaContext();
    const names = getMigrations(context.schema).map(({ name }) => name);

    expect(new Set(names).size).toBe(names.length);
  });

  it('creates an auto-incrementing store under the configured name', async () => {
    await using context = await openDatabaseContext();
    const { database, schema } = context;

    const store = database.transaction(schema.table).objectStore(schema.table);

    expect([...database.objectStoreNames]).toEqual([schema.table]);
    expect(store.autoIncrement).toBe(true);
  });

  it('creates a timestamp index under the configured name', async () => {
    await using context = await openDatabaseContext();
    const { database, schema } = context;

    const store = database.transaction(schema.table).objectStore(schema.table);

    expect([...store.indexNames]).toEqual([schema.index]);
    expect(store.index(schema.index).keyPath).toBe('timestamp');
  });
});
