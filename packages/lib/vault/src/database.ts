import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * The on-disk contract for the vault — database and store names, schema
 * version, and typed value shapes — plus the opener that applies it. The single
 * source of truth shared by the vault operations and their tests, so both speak
 * the same store names and value types.
 */

/** Database the vault persists to. One per origin. */
export const DATABASE_NAME = 'vault';

/**
 * Schema version this code knows how to create. Bump it alongside a migration
 * in {@link openVaultDatabase} whenever the stores change.
 */
export const DATABASE_VERSION = 1;

/**
 * Object store holding the single encryption key. Its value is a
 * non-extractable `CryptoKey`; IndexedDB structured-clones the handle, so the
 * key round-trips to disk without its raw bytes ever crossing into JavaScript.
 */
export const KEY_STORE = 'keys';

/** Fixed store key the single {@link KEY_STORE} entry lives at. */
export const KEY_ID = 'encryption-key';

/** Object store holding encrypted values, keyed by their id. */
export const DATA_STORE = 'data';

/** A persisted ciphertext together with the random IV its encryption used. */
export interface EncryptedRecord {
  /**
   * The AES-GCM initialization vector, fresh per write. Pinned to a plain
   * `ArrayBuffer` backing (not the wider `ArrayBufferLike`) so it satisfies the
   * `BufferSource` the Web Crypto decrypt call demands when it's read back.
   */
  iv: Uint8Array<ArrayBuffer>;
  /** The AES-GCM ciphertext, with its authentication tag appended. */
  ciphertext: ArrayBuffer;
}

/** Typed schema for the vault database, applied to every {@link openDB}. */
export interface VaultSchema extends DBSchema {
  [KEY_STORE]: {
    key: string;
    value: CryptoKey;
  };
  [DATA_STORE]: {
    key: string;
    value: EncryptedRecord;
  };
}

/** A live connection to the vault database. */
export type VaultConnection = IDBPDatabase<VaultSchema>;

/**
 * Open the vault database at {@link DATABASE_VERSION}, creating its stores on
 * first use. Runs the same in the main thread, workers, and service workers —
 * `indexedDB` is available in all three. Both stores take out-of-line keys
 * (supplied per write), since the key entry lives at a fixed id and values are
 * addressed by a caller-chosen id.
 */
export const openVaultDatabase = (): Promise<VaultConnection> =>
  openDB<VaultSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: (database) => {
      database.createObjectStore(KEY_STORE);
      database.createObjectStore(DATA_STORE);
    },
  });
