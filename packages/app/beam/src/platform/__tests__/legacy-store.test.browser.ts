/**
 * Getting an earlier Beam's database out of the way, against real
 * IndexedDB and the real device: the refusal this exists for is the
 * browser's, by way of the store.
 */

import init, { Device } from '@crate/beam';
import { clearLegacyStore, openOverLegacy } from '../legacy-store';

/** A store no other test has had. */
const storeName = () => `beam-legacy-test-${crypto.randomUUID()}`;

/** Make a database at `version` holding the object stores named. */
const createDatabase = (name: string, version: number, stores: string[]) =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => {
      for (const store of stores) request.result.createObjectStore(store);
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error ?? new Error('open failed'));
  });

/** The way the earlier Beam left one: its own stores, version 4. */
const createLegacy = (name: string) =>
  createDatabase(name, 4, ['contacts', 'onboarding']);

const versionOf = async (name: string) => {
  const databases = await indexedDB.databases();
  return databases.find((database) => database.name === name)?.version;
};

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

describe('Device.open', () => {
  it('names the refusal when the database is something else', async () => {
    const store = storeName();
    await createLegacy(store);

    await expect(open(store)).rejects.toMatchObject({
      name: 'StoreMismatched',
    });
  });
});

describe('openOverLegacy', () => {
  it('opens the device where an earlier Beam left a database', async () => {
    const store = storeName();
    await createLegacy(store);

    const device = await openOverLegacy(store, () => open(store));
    expect(device.id).toMatch(/^[0-9a-f]{64}$/);

    await device.close();
    device.free();
  });

  it("keeps the device's own store", async () => {
    const store = storeName();

    const first = await openOverLegacy(store, () => open(store));
    const id = first.id;
    await first.close();
    first.free();

    const second = await openOverLegacy(store, () => open(store));
    expect(second.id).toBe(id);

    await second.close();
    second.free();
  });

  it("leaves a mismatched database that isn't the earlier Beam's", async () => {
    const store = storeName();

    // What a later version of the store might look like from here.
    await createDatabase(store, 2, ['kept']);

    await expect(
      openOverLegacy(store, () => open(store)),
    ).rejects.toMatchObject({ name: 'StoreMismatched' });
    expect(await versionOf(store)).toBe(2);
  });

  it('passes on a refusal that has nothing to do with the store', async () => {
    const open = vi.fn(() => Promise.reject(new Error('no network')));

    await expect(openOverLegacy(storeName(), open)).rejects.toThrow(
      'no network',
    );
    expect(open).toHaveBeenCalledOnce();
  });
});

describe('clearLegacyStore', () => {
  it('deletes what the earlier Beam made, and says so', async () => {
    const store = storeName();
    await createLegacy(store);

    expect(await clearLegacyStore(store)).toBe(true);
    expect(await versionOf(store)).toBeUndefined();
  });

  it("leaves anything else, and says it's not that", async () => {
    const store = storeName();
    await createDatabase(store, 2, ['kept']);

    expect(await clearLegacyStore(store)).toBe(false);
    expect(await versionOf(store)).toBe(2);
  });
});
