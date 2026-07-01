import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * IndexedDB persistence for endpoint identities.
 *
 * iroh derives an endpoint's identity — and therefore its share link —
 * from its secret key. Persisting the key and restoring it on the next
 * connect keeps that identity stable across reloads.
 *
 * The key is stored as its raw `Uint8Array`. IndexedDB's structured clone
 * round-trips typed arrays as bytes, so there's no base64 detour — the
 * same bytes go straight to and from the wasm boundary.
 */

/* ========================================================================
 * ⚠️  WARNING: SECRET KEYS ARE STORED IN PLAINTEXT  ⚠️
 *
 * IndexedDB is not encrypted at rest. The secret key written here is the
 * private half of the endpoint's identity, and it lands on disk in the
 * clear — readable by anything with access to the browser profile (other
 * scripts on the origin, disk forensics, a synced/backed-up profile).
 *
 * This is a convenience for a work-in-progress app, NOT a secure identity
 * store. A real solution must gate the key behind a user secret — a
 * password-derived key (e.g. WebCrypto PBKDF2/AES-GCM) or a passkey —
 * and/or keep it as a non-extractable `CryptoKey`, so the raw bytes never
 * touch disk unencrypted. Revisit before this ships anywhere real.
 * ===================================================================== */

/** Database endpoint identities are persisted to. One per origin. */
const DATABASE_NAME = 'iroh';

/**
 * Schema version this code knows how to create. Bump it alongside a
 * migration whenever the store shape changes.
 */
const DATABASE_VERSION = 1;

/** Object store mapping an identity id to its raw secret-key bytes. */
const STORE_NAME = 'identities';

/** The id of the single identity we keep today — the local endpoint's. */
const ENDPOINT_IDENTITY = 'endpoint';

/** Typed schema for the identity database. */
interface IdentityDatabase extends DBSchema {
  [STORE_NAME]: {
    key: string;
    /** Raw 32-byte iroh secret key. */
    value: Uint8Array;
  };
}

/** Open (and, first time, create) the identity database. */
const openIdentityDatabase = (): Promise<IDBPDatabase<IdentityDatabase>> =>
  openDB<IdentityDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: (database) => {
      database.createObjectStore(STORE_NAME);
    },
  });

/** Load the saved endpoint secret key, or `undefined` if none is stored. */
export const loadSecretKey = async (): Promise<Uint8Array | undefined> => {
  const database = await openIdentityDatabase();
  try {
    return await database.get(STORE_NAME, ENDPOINT_IDENTITY);
  } finally {
    database.close();
  }
};

/** Persist the endpoint secret key, replacing any previously stored one. */
export const saveSecretKey = async (secretKey: Uint8Array): Promise<void> => {
  const database = await openIdentityDatabase();
  try {
    await database.put(STORE_NAME, secretKey, ENDPOINT_IDENTITY);
  } finally {
    database.close();
  }
};
