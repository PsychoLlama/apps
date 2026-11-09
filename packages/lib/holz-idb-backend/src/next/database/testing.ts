import { getMigrations, type Schema } from './migrations';
import { open } from './open';
import { remove } from './remove';

/** A unique schema whose database is removed on disposal, if it exists. */
export interface SchemaContext extends AsyncDisposable {
  schema: Schema;
}

/** A {@link SchemaContext} with an open connection, closed on disposal. */
export interface DatabaseContext extends SchemaContext {
  database: IDBDatabase;
}

/** Isolate a test from other databases. Use with `await using`. */
export const createSchemaContext = (): SchemaContext => {
  const schema: Schema = {
    name: `test-${crypto.randomUUID()}`,
    table: 'test-table',
    index: 'test-index',
  };

  return {
    schema,
    [Symbol.asyncDispose]: () => remove(schema.name),
  };
};

/** Create a {@link SchemaContext} and open its fully migrated database. */
export const openDatabaseContext = async (): Promise<DatabaseContext> => {
  const context = createSchemaContext();
  const database = await open(
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
