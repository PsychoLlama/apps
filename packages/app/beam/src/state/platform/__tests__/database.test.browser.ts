/**
 * Behavioral tests for the disk: the schema, the migration, and every
 * capability that reads or writes it. IndexedDB is real (provided by
 * Chromium), so these exercise the same path production takes — including the
 * migration, which is the one piece of this codebase that only ever runs
 * against a database somebody already has.
 */

import { deleteDB, openDB } from 'idb';
import {
  CONTACT_STORE,
  DATABASE_NAME,
  ONBOARDING_STORE,
  openBeamDatabase,
  readContacts,
  readOnboarding,
  removeContact,
  saveContact,
  saveOnboarding,
  type Contact,
  type SelfContact,
} from '../database';

/** Capabilities take a signal; nothing here cancels, so one never-aborted. */
const signal = (): AbortSignal => new AbortController().signal;

// Each test opens its own short-lived connections, so the database is the
// only state that leaks between them.
afterEach(() => deleteDB(DATABASE_NAME));

const fakeSelf: SelfContact = {
  kind: 'self',
  endpointId: 'ep-self',
  label: 'Studio',
  createdAt: 1,
};

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  kind: 'peer',
  endpointId: 'ep-1',
  label: null,
  suggestedLabel: null,
  trust: 'trusted',
  direction: 'outbound',
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

describe('openBeamDatabase', () => {
  it('creates every store on a database nobody has opened', async () => {
    const database = await openBeamDatabase();

    try {
      expect([...database.objectStoreNames].sort()).toEqual([
        CONTACT_STORE,
        ONBOARDING_STORE,
      ]);
    } finally {
      database.close();
    }
  });

  it('starts the contacts over on a database left at v2', async () => {
    // The shape v2 shipped, built by hand — the opener can only make the
    // current one, and the migration is only interesting against an old one.
    const legacy = await openDB(DATABASE_NAME, 2, {
      upgrade: (database) => {
        database.createObjectStore(CONTACT_STORE, { keyPath: 'endpointId' });
        database.createObjectStore('device');
        database.createObjectStore(ONBOARDING_STORE);
      },
    });

    await legacy.put(CONTACT_STORE, { endpointId: 'ep-1', label: 'Untagged' });
    await legacy.put(ONBOARDING_STORE, { step: 'done', updatedAt: 1 }, 'self');
    legacy.close();

    const database = await openBeamDatabase();

    try {
      // The device table is gone, and so are the rows that predate the tag —
      // there is no reading one, so keeping it would be keeping a record
      // nothing can interpret.
      expect([...database.objectStoreNames].sort()).toEqual([
        CONTACT_STORE,
        ONBOARDING_STORE,
      ]);

      expect(await database.count(CONTACT_STORE)).toBe(0);

      // Setup progress is untouched: its shape didn't change, so there is
      // nothing to rebuild and no reason to ask again.
      expect(await database.get(ONBOARDING_STORE, 'self')).toEqual({
        step: 'done',
        updatedAt: 1,
      });
    } finally {
      database.close();
    }
  });
});

describe('saveContact', () => {
  it('round-trips a contact through IndexedDB', async () => {
    const contact = fakeContact({ label: 'Work phone' });

    await saveContact(signal(), contact);

    expect(await readContacts(signal())).toEqual([contact]);
  });

  it('replaces the record already at that endpoint', async () => {
    await saveContact(signal(), fakeContact({ label: 'Old name' }));

    await saveContact(signal(), fakeContact({ label: 'New name' }));

    const contacts = await readContacts(signal());
    expect(contacts).toHaveLength(1);
    expect(contacts[0].label).toBe('New name');
  });

  it('keys the store by the endpoint carried in the record', async () => {
    const contact = fakeContact({ endpointId: 'ep-7' });

    await saveContact(signal(), contact);

    // In-line key: nothing passes the id separately, so a mismatch between
    // the record and its store key is impossible by construction.
    const database = await openBeamDatabase();
    try {
      expect(await database.get(CONTACT_STORE, 'ep-7')).toEqual(contact);
    } finally {
      database.close();
    }
  });

  it('round-trips this device’s own row through IndexedDB', async () => {
    await saveContact(signal(), fakeSelf);

    // Same table, same call, same key path as a peer — being about yourself
    // is a property of the record rather than of how it's stored.
    expect(await readContacts(signal())).toEqual([fakeSelf]);
  });
});

describe('readContacts', () => {
  it('reads an untouched book as empty', async () => {
    expect(await readContacts(signal())).toEqual([]);
  });

  it('reads every persisted contact back', async () => {
    await saveContact(signal(), fakeContact({ endpointId: 'ep-1' }));
    await saveContact(signal(), fakeContact({ endpointId: 'ep-2' }));

    expect(await readContacts(signal())).toHaveLength(2);
  });

  it('survives a contact written by a separate connection', async () => {
    const contact = fakeContact();
    const database = await openBeamDatabase();
    try {
      await database.put(CONTACT_STORE, contact);
    } finally {
      database.close();
    }

    expect(await readContacts(signal())).toEqual([contact]);
  });
});

describe('removeContact', () => {
  it('deletes the record for good', async () => {
    await saveContact(signal(), fakeContact());

    await removeContact(signal(), 'ep-1');

    expect(await readContacts(signal())).toEqual([]);
  });

  it('leaves the other contacts alone', async () => {
    await saveContact(signal(), fakeContact({ endpointId: 'ep-1' }));
    await saveContact(signal(), fakeContact({ endpointId: 'ep-2' }));

    await removeContact(signal(), 'ep-1');

    expect(await readContacts(signal())).toMatchObject([
      { endpointId: 'ep-2' },
    ]);
  });

  it('shrugs off a contact that was never there', async () => {
    await expect(removeContact(signal(), 'ep-9')).resolves.toBeUndefined();
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
