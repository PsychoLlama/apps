import { KEY_ID, KEY_STORE, type VaultConnection } from './database';

/**
 * The vault's key algorithm. 256-bit AES-GCM: authenticated encryption, so a
 * tampered or truncated ciphertext fails to decrypt rather than yielding
 * altered plaintext.
 */
const KEY_ALGORITHM: AesKeyGenParams = { name: 'AES-GCM', length: 256 };

/**
 * Fetch the vault's encryption key, generating and persisting it on first use.
 *
 * The key is generated non-extractable: the browser retains its bytes and hands
 * back only an opaque handle, so the raw key can never be read out of
 * JavaScript — not by this code, nor by anything that later gets a reference to
 * the `CryptoKey`. IndexedDB persists the handle itself.
 *
 * Safe against a concurrent first use from another context (a second tab, a
 * worker): both may generate a key, but `add` lets only the first commit win.
 * The loser catches the conflict and re-reads the winner's key, so every caller
 * converges on the one persisted key rather than encrypting under a key that's
 * about to be overwritten.
 */
export const getOrCreateKey = async (
  db: VaultConnection,
): Promise<CryptoKey> => {
  const existing = await db.get(KEY_STORE, KEY_ID);
  if (existing) return existing;

  const key = await crypto.subtle.generateKey(KEY_ALGORITHM, false, [
    'encrypt',
    'decrypt',
  ]);

  try {
    await db.add(KEY_STORE, key, KEY_ID);
    return key;
  } catch (error) {
    // Another context persisted a key between our read and write. `add` rejects
    // with a ConstraintError; discard the key we just generated and adopt the
    // one that won, so both contexts encrypt under the same key.
    if (error instanceof DOMException && error.name === 'ConstraintError') {
      const winner = await db.get(KEY_STORE, KEY_ID);
      if (winner) return winner;
    }

    throw error;
  }
};
