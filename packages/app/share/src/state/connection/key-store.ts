import { read, write, type VaultId } from '@lib/vault';

/**
 * Encrypted persistence for endpoint identities.
 *
 * iroh derives an endpoint's identity — and therefore its share link —
 * from its secret key. Persisting the key and restoring it on the next
 * connect keeps that identity stable across reloads.
 *
 * The key is the private half of the endpoint's identity, so it's stored
 * through `@lib/vault`, which encrypts it at rest under a non-extractable
 * AES-GCM key. The raw secret-key bytes never touch disk in the clear.
 */

/**
 * Vault id the endpoint's secret key is persisted under. Namespaced per the
 * vault's id convention so it can't collide with other stored values.
 */
const SECRET_KEY_ID: VaultId = 'iroh/secret-key';

/** Load the saved endpoint secret key, or `undefined` if none is stored. */
export const loadSecretKey = async (): Promise<Uint8Array | undefined> => {
  const stored = await read(SECRET_KEY_ID);
  return stored ? new Uint8Array(stored) : undefined;
};

/** Persist the endpoint secret key, replacing any previously stored one. */
export const saveSecretKey = async (secretKey: Uint8Array): Promise<void> => {
  // Copy into a fresh, plain-`ArrayBuffer`-backed view. iroh types its bytes
  // as the wider `Uint8Array<ArrayBufferLike>`, which vault's `BufferSource`
  // parameter won't accept directly.
  await write(SECRET_KEY_ID, new Uint8Array(secretKey));
};
