// The vault's public surface: at-rest encryption for browser environments. A
// single non-extractable key, persisted to IndexedDB, encrypts and decrypts
// values addressed by id.
export { read, write, type VaultId } from './vault';
