/**
 * Behavioral tests for the address book's persistence. IndexedDB is real
 * (provided by Chromium), so these exercise the same path production takes:
 * the capabilities open the database, write through the contact store, and
 * read it back across connections.
 */

import { deleteDB } from 'idb';
import { now, readContacts, removeContact, saveContact } from '../capabilities';
import {
  CONTACT_STORE,
  DATABASE_NAME,
  openBeamDatabase,
  type Contact,
} from '../database';

/** Capabilities take a signal; nothing here cancels, so one never-aborted. */
const signal = (): AbortSignal => new AbortController().signal;

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  endpointId: 'ep-1',
  label: null,
  suggestedLabel: null,
  trust: 'trusted',
  direction: 'outbound',
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

// Each test opens its own short-lived connections, so the database is the
// only state that leaks between them.
afterEach(() => deleteDB(DATABASE_NAME));

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

describe('now', () => {
  it('reads the wall clock in epoch milliseconds', () => {
    const before = Date.now();

    const stamp = now();

    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(Date.now());
  });
});
