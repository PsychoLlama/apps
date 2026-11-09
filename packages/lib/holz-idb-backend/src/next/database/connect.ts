import type { Migration } from './migrations';
import { openOrUpgrade } from './open';

/** Options for {@link connect}. */
export interface ConnectConfig {
  /** Database to stay connected to. */
  name: string;

  /** Applied whenever a connection finds the database behind. */
  migrations: Migration[];

  /**
   * Receives each new connection, then `null` when it goes away. Start no
   * transactions after `null`, and leave closing to {@link connect}.
   */
  onChange: (database: IDBDatabase | null) => void;

  /** Receives whatever stops the connection for good. Nothing retries after. */
  onError: (error: unknown) => void;
}

/**
 * Stay connected to a database for as long as possible. Gives up the connection
 * when another context needs to upgrade or delete the database, or when the
 * browser closes it. A new connection follows unless reopening fails.
 *
 * Returns a function that closes the connection for good. An open already
 * underway still applies its migrations, but its outcome is ignored.
 */
export const connect = (config: ConnectConfig): (() => void) => {
  let terminated = false;
  let current: IDBDatabase | null = null;

  const attach = () => {
    if (terminated) return;

    // TODO: On `VersionError`, retry without a version to attach to whatever a
    // newer peer left. Until then, a peer's upgrade ends the connection for
    // good.
    openOrUpgrade(config.name, config.migrations)
      .then((db) => {
        // Request canceled while opening.
        if (terminated) return db.close();

        // Release and reconnect if:
        // - We're blocking a new migration (assumes version is compatible)
        // - The DB was deleted or closed unexpectedly.
        //
        // Note: `close()` waits for in-flight transactions.
        db.onclose = db.onversionchange = reconnect;

        // Successfully connected.
        config.onChange((current = db));
      })
      .catch((error: unknown) => {
        if (terminated) return;

        // A throwing `onChange` leaves a live connection behind.
        terminate();
        config.onError(error);
      });
  };

  const disconnect = () => {
    // Already closed.
    if (!current) return;

    // Late events from a released connection must not disturb the next one.
    current.onclose = current.onversionchange = null;
    current.close();
    config.onChange((current = null));
  };

  const reconnect = () => {
    disconnect();
    attach();
  };

  const terminate = () => {
    terminated = true;
    disconnect();
  };

  attach();

  return terminate;
};
