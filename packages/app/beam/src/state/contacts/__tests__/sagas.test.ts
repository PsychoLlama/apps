/**
 * Unit tests for the address book's sagas. These run under `simulate`, so
 * there's no runtime and no state — IndexedDB and the clock are stubbed, and
 * the assertions are about what each saga published and wrote through.
 */

import { simulate } from '@lib/state';
import { now, readContacts, removeContact, saveContact } from '../capabilities';
import {
  contactAdvertisedTopic,
  contactForgottenTopic,
  contactRenamedTopic,
  contactSeenTopic,
  contactsLoadFailedTopic,
  contactsLoadingTopic,
  contactsRestoredTopic,
  contactsStore,
  pairingAcceptedTopic,
  pairingConfirmedTopic,
  selfNamedTopic,
} from '../contacts';
import {
  acceptContactSaga,
  confirmContactSaga,
  forgetContactSaga,
  nameSelfSaga,
  noteAdvertisedNameSaga,
  recordPeerSaga,
  renameContactSaga,
  restoreContactsSaga,
} from '../sagas';
import { identityStore } from '../../session/identity';
import type { Contact, SelfContact } from '../../database';

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

/** A book holding one contact, as the write-through path reads it back. */
const bookHolding = (contact: Contact) => ({
  status: 'ready' as const,
  self: null,
  entries: { [contact.endpointId]: contact },
});

/** A book whose only row is this device's, as the naming path reads it back. */
const bookNaming = (self: SelfContact | null) => ({
  status: 'ready' as const,
  self,
  entries: {},
});

describe('restoreContactsSaga', () => {
  it('lands the persisted book in memory', async () => {
    const contact = fakeContact();

    const trace = await simulate(restoreContactsSaga(), {
      reads: [[contactsStore, { status: 'initial', self: null, entries: {} }]],
      calls: [[readContacts, () => [contact]]],
    });

    expect(trace.commits).toEqual([
      [contactsLoadingTopic()],
      [contactsRestoredTopic([contact])],
    ]);
  });

  it('records an unreadable book without claiming it is empty', async () => {
    const trace = await simulate(restoreContactsSaga(), {
      reads: [[contactsStore, { status: 'initial', self: null, entries: {} }]],
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

describe('noteAdvertisedNameSaga', () => {
  it('commits the advertised name before writing it through', async () => {
    const contact = fakeContact({ suggestedLabel: 'Studio Mac' });
    const save = vi.fn();

    const trace = await simulate(
      noteAdvertisedNameSaga({ endpointId: 'ep-1', label: 'Studio Mac' }),
      {
        reads: [[contactsStore, bookHolding(contact)]],
        calls: [[saveContact, save]],
      },
    );

    expect(trace.commits).toEqual([
      [contactAdvertisedTopic({ endpointId: 'ep-1', label: 'Studio Mac' })],
    ]);
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), contact);
  });
});

describe('acceptContactSaga', () => {
  it('promotes the pairing and writes it through', async () => {
    const contact = fakeContact({ trust: 'trusted', direction: 'inbound' });
    const save = vi.fn();

    const trace = await simulate(acceptContactSaga('ep-1'), {
      reads: [[contactsStore, bookHolding(contact)]],
      calls: [[saveContact, save]],
    });

    // Accepting has to survive a reload — it's the half of the handshake
    // that doesn't depend on the peer still being there.
    expect(trace.commits).toEqual([[pairingAcceptedTopic('ep-1')]]);
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), contact);
  });
});

describe('confirmContactSaga', () => {
  it('records the peer\u2019s claim and writes the result through', async () => {
    const contact = fakeContact({ trust: 'trusted' });
    const save = vi.fn();

    const trace = await simulate(confirmContactSaga('ep-1'), {
      reads: [[contactsStore, bookHolding(contact)]],
      calls: [[saveContact, save]],
    });

    // The saga passes the claim on; whether to believe it is the fold's
    // call, and the write only copies out whatever the fold decided.
    expect(trace.commits).toEqual([[pairingConfirmedTopic('ep-1')]]);
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), contact);
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

describe('nameSelfSaga', () => {
  const SELF_ID = 'ep-self';

  const fakeSelf = (overrides: Partial<SelfContact> = {}): SelfContact => ({
    kind: 'self',
    endpointId: SELF_ID,
    label: 'Studio',
    createdAt: 1234,
    ...overrides,
  });

  it('names this device and writes the row through', async () => {
    const save = vi.fn();

    const trace = await simulate(nameSelfSaga('Studio'), {
      reads: [
        [identityStore, { endpointId: SELF_ID }],
        [contactsStore, bookNaming(fakeSelf())],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, save],
        [removeContact, vi.fn()],
      ],
    });

    expect(trace.commits).toEqual([
      [selfNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1234 })],
    ]);

    // Read back out of the store rather than rebuilt here, so the fold stays
    // the single place that decides what the row looks like.
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), fakeSelf());
    expect(trace.result).toBe(true);
  });

  it('normalizes the name before it is written anywhere', async () => {
    const trace = await simulate(nameSelfSaga('  Kitchen iPad \n'), {
      reads: [
        [identityStore, { endpointId: SELF_ID }],
        [contactsStore, bookNaming(null)],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [removeContact, vi.fn()],
      ],
    });

    // This one is persisted, so what reaches the fact has to be what the
    // store would settle on rather than whatever the field held.
    expect(trace.commits).toEqual([
      [
        selfNamedTopic({
          endpointId: SELF_ID,
          label: 'Kitchen iPad',
          at: 1234,
        }),
      ],
    ]);
  });

  it('refuses a name that is only whitespace', async () => {
    const save = vi.fn();

    const trace = await simulate(nameSelfSaga('   '), {
      reads: [
        [identityStore, { endpointId: SELF_ID }],
        [contactsStore, bookNaming(null)],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, save],
        [removeContact, vi.fn()],
      ],
    });

    // A field holding two spaces looks filled in and isn't. Saving it would
    // leave the device worse off than unnamed: the fallback to its key prefix
    // stops working, and every peer is told it's called nothing at all.
    expect(save).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
    expect(trace.result).toBe(false);
  });

  it('waits for a key before writing a row keyed by one', async () => {
    const save = vi.fn();

    const trace = await simulate(nameSelfSaga('Studio'), {
      reads: [
        [identityStore, { endpointId: null }],
        [contactsStore, bookNaming(null)],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, save],
        [removeContact, vi.fn()],
      ],
    });

    expect(save).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
    expect(trace.result).toBe(false);
  });

  it('clears the row the key used to answer on', async () => {
    const remove = vi.fn();

    await simulate(nameSelfSaga('Studio'), {
      reads: [
        [identityStore, { endpointId: SELF_ID }],
        [contactsStore, bookNaming(fakeSelf({ endpointId: 'old-key' }))],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [removeContact, remove],
      ],
    });

    // The name follows the device, and there is only ever one row for it —
    // a rotated key would otherwise leave a second behind, and the read that
    // picked one up would be picking arbitrarily.
    expect(remove).toHaveBeenCalledWith(expect.any(AbortSignal), 'old-key');
  });

  it('leaves the row alone when the key never moved', async () => {
    const remove = vi.fn();

    await simulate(nameSelfSaga('Kitchen'), {
      reads: [
        [identityStore, { endpointId: SELF_ID }],
        [contactsStore, bookNaming(fakeSelf())],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [removeContact, remove],
      ],
    });

    // A rename is a rename. Deleting the row it's replacing would be a
    // window where this device has no name at all.
    expect(remove).not.toHaveBeenCalled();
  });
});
