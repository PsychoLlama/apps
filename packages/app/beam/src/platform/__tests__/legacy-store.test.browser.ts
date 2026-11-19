/**
 * Clearing an earlier Beam's database, against real IndexedDB and the real
 * device: the failure this exists for is the browser's, not ours.
 */

import init, { Device } from '@crate/beam';
import { clearLegacyStore } from '../legacy-store';

/** A store no other test has had. */
const storeName = () => `beam-legacy-test-${crypto.randomUUID()}`;

/** Make a database the way the earlier Beam did: its own stores, version 4. */
const createLegacy = (name: string) =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(name, 4);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('contacts');
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error ?? new Error('open failed'));
  });

const open = (store: string) =>
  Device.open(
    store,
    () => {},
    () => {},
    () => {},
  );

beforeAll(async () => {
  await init();
});

describe('clearLegacyStore', () => {
  it('lets the device open where an earlier Beam left a database', async () => {
    const store = storeName();
    await createLegacy(store);

    // The failure being fixed: the store can't be opened over it.
    await expect(open(store)).rejects.toThrow();

    await clearLegacyStore(store);

    const device = await open(store);
    expect(device.id).toMatch(/^[0-9a-f]{64}$/);

    await device.close();
    device.free();
  });

  it("leaves the device's own store alone", async () => {
    const store = storeName();

    const first = await open(store);
    const id = first.id;
    await first.close();
    first.free();

    await clearLegacyStore(store);

    const second = await open(store);
    expect(second.id).toBe(id);

    await second.close();
    second.free();
  });

  it('does nothing when there is no database', async () => {
    const store = storeName();

    await clearLegacyStore(store);

    const databases = await indexedDB.databases();
    expect(databases.map((database) => database.name)).not.toContain(store);
  });
});
