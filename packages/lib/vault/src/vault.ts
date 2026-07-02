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
 * Bind a ciphertext to the id it lives under, as AES-GCM additional
 * authenticated data. Every value shares one key, so without this any two
 * ciphertexts would be interchangeable — decryption only proves "written by
 * someone holding the key," not "written at *this* id." Feeding the id as AAD
 * folds it into the authentication tag, so a record only decrypts at the exact
 * id it was written to.
 *
 * The AAD is never stored: the id *is* the store key, so it's recomputed from
 * the id on both sides. This raises the bar for an attacker who can shuffle
 * IndexedDB records but not run code in the origin (a browser extension,
 * devtools, raw disk access, or a limited injection that moves bytes without
 * reaching this API) — they can no longer relocate a value from one id to
 * another and have it decrypt. It does *not* stop an attacker with full
 * same-origin execution (they can just call {@link read}/{@link write}), nor
 * rolling a value back to an earlier ciphertext at the *same* id — the binding
 * is over identity, not freshness.
 */
const bindingFor = (id: VaultId): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(id);

/**
 * Encrypt `data` under the vault's key and persist it at `id`, replacing any
 * value already there. Generates the key on first use.
 *
 * A fresh random IV is drawn per write. Reusing an IV under one key is the
 * single thing that breaks AES-GCM's guarantees, so the IV is never derived
 * from the id or carried over from a previous write — it is stored alongside
 * the ciphertext for {@link read} to reuse. The id is also folded in as
 * {@link bindingFor additional authenticated data}, tying the ciphertext to its
 * id.
 *
 * `data` is taken as {@link AllowSharedBufferSource} — the widest byte-buffer
 * type — so callers holding a `Uint8Array` with the default `ArrayBufferLike`
 * backing (e.g. bytes from a wasm binding) can pass it straight through without
 * first copying it into an `ArrayBuffer`-backed view.
 */
export const write = async (
  id: VaultId,
  data: AllowSharedBufferSource,
): Promise<void> => {
  const db = await openVaultDatabase();

  try {
    const key = await getOrCreateKey(db);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ciphertext = await crypto.subtle.encrypt(
      // `encrypt` accepts shared buffers at runtime, but its lib signature pins
      // `data` to the narrower `BufferSource`; the cast bridges that gap.
      { name: 'AES-GCM', iv, additionalData: bindingFor(id) },
      key,
      data as BufferSource,
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
 * a key that no longer matches, or a record {@link bindingFor relocated} from a
 * different id — rather than handing back altered or substituted bytes.
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
      { name: 'AES-GCM', iv: record.iv, additionalData: bindingFor(id) },
      key,
      record.ciphertext,
    );
  } finally {
    db.close();
  }
};
