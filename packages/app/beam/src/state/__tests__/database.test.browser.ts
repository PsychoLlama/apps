/**
 * Behavioral tests for the single-record tables and the schema that creates
 * them. IndexedDB is real (provided by Chromium), so these exercise the same
 * path production takes — including the migration, which is the one piece of
 * this codebase that only ever runs against a database somebody already has.
 */

import { deleteDB, openDB } from 'idb';
import { readDeviceName, saveDeviceName } from '../device/capabilities';
import { readOnboarding, saveOnboarding } from '../onboarding/capabilities';
import {
  CONTACT_STORE,
  DATABASE_NAME,
  DEVICE_STORE,
  ONBOARDING_STORE,
  openBeamDatabase,
} from '../database';

/** Capabilities take a signal; nothing here cancels, so one never-aborted. */
const signal = (): AbortSignal => new AbortController().signal;

// Each test opens its own short-lived connections, so the database is the
// only state that leaks between them.
afterEach(() => deleteDB(DATABASE_NAME));

describe('openBeamDatabase', () => {
  it('creates every store on a database nobody has opened', async () => {
    const database = await openBeamDatabase();

    try {
      expect([...database.objectStoreNames].sort()).toEqual([
        CONTACT_STORE,
        DEVICE_STORE,
        ONBOARDING_STORE,
      ]);
    } finally {
      database.close();
    }
  });

  it('adds the new stores to a database left at v1', async () => {
    // The shape v1 shipped, built by hand — the opener can only make the
    // current one, and the migration is only interesting against an old one.
    const legacy = await openDB(DATABASE_NAME, 1, {
      upgrade: (database) => {
        database.createObjectStore(CONTACT_STORE, { keyPath: 'endpointId' });
      },
    });

    await legacy.put(CONTACT_STORE, {
      endpointId: 'ep-1',
      label: null,
      suggestedLabel: null,
      trust: 'trusted',
      direction: 'outbound',
      createdAt: 1,
      lastSeenAt: 1,
    });

    legacy.close();

    const database = await openBeamDatabase();

    try {
      expect([...database.objectStoreNames].sort()).toEqual([
        CONTACT_STORE,
        DEVICE_STORE,
        ONBOARDING_STORE,
      ]);

      // The contacts come through untouched. A migration that drops what was
      // already there is the one failure nobody recovers from.
      expect(await database.count(CONTACT_STORE)).toBe(1);
    } finally {
      database.close();
    }
  });
});

describe('saveDeviceName', () => {
  it('round-trips the name through IndexedDB', async () => {
    await saveDeviceName(signal(), 'Studio');

    expect(await readDeviceName(signal())).toBe('Studio');
  });

  it('replaces the name already stored', async () => {
    await saveDeviceName(signal(), 'Old name');

    await saveDeviceName(signal(), 'New name');

    // One row, under a constant key: a second name is a rename, never a
    // second device.
    expect(await readDeviceName(signal())).toBe('New name');
  });
});

describe('readDeviceName', () => {
  it('reads an untouched table as an unnamed device', async () => {
    expect(await readDeviceName(signal())).toBeNull();
  });
});

describe('saveOnboarding', () => {
  it('round-trips the step and its date through IndexedDB', async () => {
    const record = { step: 'pairing' as const, updatedAt: 1234 };

    await saveOnboarding(signal(), record);

    expect(await readOnboarding(signal())).toEqual(record);
  });

  it('replaces the progress already stored', async () => {
    await saveOnboarding(signal(), { step: 'pairing', updatedAt: 1 });

    await saveOnboarding(signal(), { step: 'done', updatedAt: 2 });

    expect(await readOnboarding(signal())).toEqual({
      step: 'done',
      updatedAt: 2,
    });
  });
});

describe('readOnboarding', () => {
  it('reads an untouched table as a device nobody has set up', async () => {
    expect(await readOnboarding(signal())).toBeNull();
  });
});
