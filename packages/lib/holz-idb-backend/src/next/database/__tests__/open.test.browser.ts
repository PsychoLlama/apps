import type { Migration } from '../migrations';
import { open } from '../open';
import { createSchemaContext } from '../testing';

const createMigration = (name: string) => ({
  name,
  run: vi.fn<Migration['run']>(),
});

const createThrowingMigration = (error: Error): Migration => ({
  name: 'broken',
  run: () => {
    throw error;
  },
});

describe('open', () => {
  it('opens at the version implied by the migrations', async () => {
    await using context = createSchemaContext();

    const database = await open(context.schema.name, [
      createMigration('first'),
      createMigration('second'),
    ]);

    database.close();

    expect(database.version).toBe(2);
  });

  it('runs every migration in order on a new database', async () => {
    await using context = createSchemaContext();
    const calls: string[] = [];
    const migrations = ['first', 'second'].map((name) => ({
      name,
      run: () => void calls.push(name),
    }));

    (await open(context.schema.name, migrations)).close();

    expect(calls).toEqual(['first', 'second']);
  });

  it('passes the database to each migration', async () => {
    await using context = createSchemaContext();
    const migration = createMigration('first');

    const database = await open(context.schema.name, [migration]);
    database.close();

    expect(migration.run).toHaveBeenCalledWith(database);
  });

  it('runs only the migrations the database has not seen', async () => {
    await using context = createSchemaContext();
    const { name } = context.schema;
    const first = createMigration('first');
    const second = createMigration('second');

    (await open(name, [first])).close();
    (await open(name, [first, second])).close();

    expect(first.run).toHaveBeenCalledTimes(1);
    expect(second.run).toHaveBeenCalledTimes(1);
  });

  it('runs nothing when the database is current', async () => {
    await using context = createSchemaContext();
    const { name } = context.schema;
    const migration = createMigration('first');

    (await open(name, [migration])).close();
    (await open(name, [migration])).close();

    expect(migration.run).toHaveBeenCalledTimes(1);
  });

  it('rejects when the database is past the migrations', async () => {
    await using context = createSchemaContext();
    const { name } = context.schema;
    const first = createMigration('first');
    const second = createMigration('second');

    (await open(name, [first, second])).close();

    await expect(open(name, [first])).rejects.toMatchObject({
      name: 'VersionError',
    });
  });

  it('rejects with the error a migration throws', async () => {
    await using context = createSchemaContext();
    const error = new Error('Migration failed.');
    const migration = createThrowingMigration(error);

    await expect(open(context.schema.name, [migration])).rejects.toBe(error);
  });

  it('creates nothing when a migration on a new database throws', async () => {
    await using context = createSchemaContext();
    const { name } = context.schema;
    const migration = createThrowingMigration(new Error('Migration failed.'));

    await expect(open(name, [migration])).rejects.toThrow();

    const databases = await indexedDB.databases();
    expect(databases.map((database) => database.name)).not.toContain(name);
  });

  it('rolls back the whole upgrade when a migration throws', async () => {
    await using context = createSchemaContext();
    const { name } = context.schema;
    const first = createMigration('first');
    const added = {
      name: 'added',
      run: (database: IDBDatabase) => void database.createObjectStore('added'),
    };
    const broken = createThrowingMigration(new Error('Migration failed.'));

    (await open(name, [first])).close();
    await expect(open(name, [first, added, broken])).rejects.toThrow();

    const database = await open(name, [first]);
    database.close();

    expect(database.version).toBe(1);
    expect([...database.objectStoreNames]).toEqual([]);
    expect(first.run).toHaveBeenCalledTimes(1);
  });
});
