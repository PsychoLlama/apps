/**
 * Behavioral tests for the vault. Web Crypto and IndexedDB are real (provided
 * by Chromium), so the tests exercise the same path production code takes:
 * `write` encrypts under a persisted non-extractable key and stores the
 * ciphertext; `read` fetches and decrypts it.
 */

import { deleteDB } from 'idb';

import { read, write } from '../vault';
import {
  DATA_STORE,
  DATABASE_NAME,
  KEY_STORE,
  openVaultDatabase,
  type EncryptedRecord,
} from '../database';

// No return annotation: `TextEncoder.encode` yields a `Uint8Array<ArrayBuffer>`,
// and annotating it `Uint8Array` would widen the backing buffer to
// `ArrayBufferLike` — no longer assignable to the `BufferSource` `write` takes.
const encode = (text: string) => new TextEncoder().encode(text);
const decode = (buffer: ArrayBuffer): string =>
  new TextDecoder().decode(buffer);

/** Read a stored ciphertext record straight from the store, bypassing decrypt. */
const readRecord = async (id: string): Promise<EncryptedRecord | undefined> => {
  const db = await openVaultDatabase();
  try {
    return await db.get(DATA_STORE, id);
  } finally {
    db.close();
  }
};

/** Every persisted `CryptoKey`. The vault should never hold more than one. */
const readKeys = async (): Promise<CryptoKey[]> => {
  const db = await openVaultDatabase();
  try {
    return await db.getAll(KEY_STORE);
  } finally {
    db.close();
  }
};

describe('vault', () => {
  beforeEach(async () => {
    // Drop the whole database so each test starts with no key and no values —
    // a genuine first-use origin, the state the key-generation path assumes.
    await deleteDB(DATABASE_NAME);
  });

  it('round-trips a written value', async () => {
    await write('greeting', encode('hello vault'));

    const value = await read('greeting');

    expect(value).not.toBeNull();
    expect(decode(value!)).toBe('hello vault');
  });

  it('resolves null for an id that was never written', async () => {
    expect(await read('absent')).toBeNull();
  });

  it('does not generate a key just to read a missing value', async () => {
    await read('absent');

    // A read that finds nothing must not touch the key store — there's nothing
    // to decrypt, so nothing to key.
    expect(await readKeys()).toHaveLength(0);
  });

  it('overwrites the value at an existing id', async () => {
    await write('token', encode('first'));
    await write('token', encode('second'));

    expect(decode((await read('token'))!)).toBe('second');
  });

  it('keeps values at different ids independent', async () => {
    await write('a', encode('value-a'));
    await write('b', encode('value-b'));

    expect(decode((await read('a'))!)).toBe('value-a');
    expect(decode((await read('b'))!)).toBe('value-b');
  });

  it('round-trips arbitrary binary, not just text', async () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255]);

    await write('binary', bytes);

    expect(new Uint8Array((await read('binary'))!)).toEqual(bytes);
  });

  it('persists a single non-extractable key and reuses it across writes', async () => {
    await write('one', encode('first'));
    await write('two', encode('second'));

    const keys = await readKeys();
    expect(keys).toHaveLength(1);
    expect(keys[0].extractable).toBe(false);
    expect(keys[0].type).toBe('secret');
    expect(keys[0].algorithm).toMatchObject({ name: 'AES-GCM' });
  });

  it('stores ciphertext, never the plaintext', async () => {
    await write('secret', encode('super secret'));

    const record = await readRecord('secret');
    expect(record).toBeDefined();
    // The stored bytes must not contain the plaintext.
    expect(decode(record!.ciphertext)).not.toContain('super secret');
  });

  it('draws a fresh IV for every write, even of identical plaintext', async () => {
    await write('x', encode('same'));
    const first = await readRecord('x');
    await write('x', encode('same'));
    const second = await readRecord('x');

    // Reusing an IV under one key is the single thing that breaks AES-GCM, so
    // two writes of the same bytes must land under different IVs — and thus
    // different ciphertexts.
    expect([...second!.iv]).not.toEqual([...first!.iv]);
    expect([...new Uint8Array(second!.ciphertext)]).not.toEqual([
      ...new Uint8Array(first!.ciphertext),
    ]);
  });

  it('rejects a read when the ciphertext was tampered with', async () => {
    await write('protected', encode('do not touch'));

    // Flip a byte of the stored ciphertext and write it back. AES-GCM's
    // authentication tag must catch the change.
    const db = await openVaultDatabase();
    try {
      const record = (await db.get(DATA_STORE, 'protected'))!;
      new Uint8Array(record.ciphertext)[0] ^= 0xff;
      await db.put(DATA_STORE, record, 'protected');
    } finally {
      db.close();
    }

    await expect(read('protected')).rejects.toThrow();
  });

  it('rejects a read when a ciphertext is relocated to a different id', async () => {
    await write('source', encode('bound to source'));

    // Copy the raw ciphertext record onto a different id — exactly what an
    // attacker with IndexedDB access but no key could do (an extension,
    // devtools, disk access). The id is folded into the AES-GCM tag as
    // additional authenticated data, so the record must fail to decrypt at the
    // id it was moved to.
    const db = await openVaultDatabase();
    try {
      const record = (await db.get(DATA_STORE, 'source'))!;
      await db.put(DATA_STORE, record, 'destination');
    } finally {
      db.close();
    }

    await expect(read('destination')).rejects.toThrow();
    // The value still decrypts at the id it was actually written under.
    expect(decode((await read('source'))!)).toBe('bound to source');
  });

  it('rejects a read when a value survives but its key is gone', async () => {
    await write('orphan', encode('unrecoverable'));

    // Clear the key out from under a stored value: the ciphertext can no longer
    // be decrypted, and returning null would masquerade as "never written."
    const db = await openVaultDatabase();
    try {
      await db.clear(KEY_STORE);
    } finally {
      db.close();
    }

    await expect(read('orphan')).rejects.toThrow(/encryption key is missing/);
  });
});
