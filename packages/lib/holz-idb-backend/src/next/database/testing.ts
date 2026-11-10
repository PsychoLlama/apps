import { getMigrations, type DatabaseConfig } from './migrations';
import { openOrUpgrade } from './open';
import { deleteDatabase } from './delete-database';

/** A unique schema whose database is removed on disposal, if it exists. */
export interface SchemaContext extends AsyncDisposable {
  schema: DatabaseConfig;
}

/** A {@link SchemaContext} with an open connection, closed on disposal. */
export interface DatabaseContext extends SchemaContext {
  database: IDBDatabase;
}

/** Isolate a test from other databases. Use with `await using`. */
export const createSchemaContext = (): SchemaContext => {
  const schema: DatabaseConfig = {
    name: `test-${crypto.randomUUID()}`,
    table: 'test-table',
    index: 'test-index',
  };

  return {
    schema,
    [Symbol.asyncDispose]: () => deleteDatabase(schema.name),
  };
};

/** Create a {@link SchemaContext} and open its fully migrated database. */
export const openDatabaseContext = async (): Promise<DatabaseContext> => {
  const context = createSchemaContext();
  const database = await openOrUpgrade(
    context.schema.name,
    getMigrations(context.schema),
  );

  return {
    ...context,
    database,
    [Symbol.asyncDispose]: async () => {
      database.close();
      await context[Symbol.asyncDispose]();
    },
  };
};
