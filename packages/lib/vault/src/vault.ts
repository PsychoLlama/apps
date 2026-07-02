import {
  DATA_STORE,
  KEY_ID,
  KEY_STORE,
  openVaultDatabase,
  type EncryptedRecord,
} from './database';
import { getOrCreateKey } from './key';

/**
 * Identifier a value is stored under. Consumers define their own as string
 * constants — namespaced like `'some-scope/some-value'` to keep unrelated
 * values from colliding — and the vault treats them opaquely as store keys.
 */
export type VaultId = string;

/**
 * Byte length of the AES-GCM initialization vector. 96 bits is the size GCM is
 * defined around and the one the spec recommends.
 */
const IV_LENGTH = 12;

/**
 * Encrypt `data` under the vault's key and persist it at `id`, replacing any
 * value already there. Generates the key on first use.
 *
 * A fresh random IV is drawn per write. Reusing an IV under one key is the
 * single thing that breaks AES-GCM's guarantees, so the IV is never derived
 * from the id or carried over from a previous write — it is stored alongside
 * the ciphertext for {@link read} to reuse.
 */
export const write = async (id: VaultId, data: BufferSource): Promise<void> => {
  const db = await openVaultDatabase();

  try {
    const key = await getOrCreateKey(db);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data,
    );

    const record: EncryptedRecord = { iv, ciphertext };
    await db.put(DATA_STORE, record, id);
  } finally {
    db.close();
  }
};

/**
 * Read and decrypt the value stored at `id`. Resolves `null` when nothing has
 * been written there.
 *
 * Rejects if the stored ciphertext fails authentication — tampering, bit rot,
 * or a key that no longer matches — rather than handing back altered bytes.
 */
export const read = async (id: VaultId): Promise<ArrayBuffer | null> => {
  const db = await openVaultDatabase();

  try {
    const record = await db.get(DATA_STORE, id);
    if (!record) return null;

    const key = await db.get(KEY_STORE, KEY_ID);
    if (!key) {
      // A value can only be written after its key is generated, so a record
      // with no key means the key store was cleared or tampered with out from
      // under it — the ciphertext is unrecoverable, and silently returning
      // `null` would masquerade as "never written."
      throw new Error(
        `Vault holds a value at "${id}" but its encryption key is missing.`,
      );
    }

    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: record.iv },
      key,
      record.ciphertext,
    );
  } finally {
    db.close();
  }
};
