/**
 * Unit tests for the address book's sagas. These run under `simulate`, so
 * there's no runtime and no state — IndexedDB and the clock are stubbed, and
 * the assertions are about what each saga published and wrote through.
 */

import { simulate } from '@lib/state';
import { now, readContacts, removeContact, saveContact } from '../capabilities';
import {
  contactForgottenTopic,
  contactRenamedTopic,
  contactSeenTopic,
  contactsLoadFailedTopic,
  contactsLoadingTopic,
  contactsRestoredTopic,
  contactsStore,
} from '../contacts';
import {
  forgetContactSaga,
  recordPeerSaga,
  renameContactSaga,
  restoreContactsSaga,
} from '../sagas';
import type { Contact } from '../database';

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

/** A book holding one contact, as the write-through path reads it back. */
const bookHolding = (contact: Contact) => ({
  status: 'ready' as const,
  entries: { [contact.endpointId]: contact },
});

describe('restoreContactsSaga', () => {
  it('lands the persisted book in memory', async () => {
    const contact = fakeContact();

    const trace = await simulate(restoreContactsSaga(), {
      reads: [[contactsStore, { status: 'initial', entries: {} }]],
      calls: [[readContacts, () => [contact]]],
    });

    expect(trace.commits).toEqual([
      [contactsLoadingTopic()],
      [contactsRestoredTopic([contact])],
    ]);
  });

  it('records an unreadable book without claiming it is empty', async () => {
    const trace = await simulate(restoreContactsSaga(), {
      reads: [[contactsStore, { status: 'initial', entries: {} }]],
      calls: [
        [
          readContacts,
          () => {
            throw new Error('IndexedDB is blocked');
          },
        ],
      ],
    });

    expect(trace.commits).toEqual([
      [contactsLoadingTopic()],
      [contactsLoadFailedTopic()],
    ]);
  });

  it('refuses to re-read over a book already loaded', async () => {
    const read = vi.fn(() => []);

    const trace = await simulate(restoreContactsSaga(), {
      reads: [[contactsStore, { status: 'ready', entries: {} }]],
      calls: [[readContacts, read]],
    });

    // A second anchor must not clobber changes made since the first read.
    expect(read).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('recordPeerSaga', () => {
  it('stamps the sighting with the clock it was told', async () => {
    const contact = fakeContact({ endpointId: 'ep-2' });

    const trace = await simulate(
      recordPeerSaga({ endpointId: 'ep-2', direction: 'outbound' }),
      {
        reads: [[contactsStore, bookHolding(contact)]],
        calls: [
          [now, () => 1234],
          [saveContact, vi.fn()],
        ],
      },
    );

    expect(trace.commits).toEqual([
      [
        contactSeenTopic({
          endpointId: 'ep-2',
          direction: 'outbound',
          seenAt: 1234,
        }),
      ],
    ]);
  });

  it('writes the contact through to disk', async () => {
    const save = vi.fn();
    const contact = fakeContact({ endpointId: 'ep-2' });

    await simulate(
      recordPeerSaga({ endpointId: 'ep-2', direction: 'inbound' }),
      {
        reads: [[contactsStore, bookHolding(contact)]],
        calls: [
          [now, () => 1234],
          [saveContact, save],
        ],
      },
    );

    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), contact);
  });
});

describe('renameContactSaga', () => {
  it('commits the rename before writing it through', async () => {
    const contact = fakeContact({ label: 'Work phone' });
    const save = vi.fn();

    const trace = await simulate(
      renameContactSaga({ endpointId: 'ep-1', label: 'Work phone' }),
      {
        reads: [[contactsStore, bookHolding(contact)]],
        calls: [[saveContact, save]],
      },
    );

    expect(trace.commits).toEqual([
      [contactRenamedTopic({ endpointId: 'ep-1', label: 'Work phone' })],
    ]);
    // The fold decides what the record becomes; the write only copies it out.
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), contact);
  });

  it('skips the write when the contact vanished under it', async () => {
    const save = vi.fn();

    await simulate(renameContactSaga({ endpointId: 'ep-1', label: 'Gone' }), {
      reads: [[contactsStore, { status: 'ready', entries: {} }]],
      calls: [[saveContact, save]],
    });

    expect(save).not.toHaveBeenCalled();
  });
});

describe('forgetContactSaga', () => {
  it('deletes the record rather than writing it back', async () => {
    const remove = vi.fn();

    const trace = await simulate(forgetContactSaga('ep-1'), {
      calls: [[removeContact, remove]],
    });

    expect(trace.commits).toEqual([[contactForgottenTopic('ep-1')]]);
    expect(remove).toHaveBeenCalledWith(expect.any(AbortSignal), 'ep-1');
  });
});
