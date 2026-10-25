import { createTestController } from '@lib/effects/testing';
import {
  readContacts,
  removeContact,
  saveContact,
  type SelfContact,
} from '../../platform/database';
import {
  $contacts,
  $contactsRestored,
  $draftChanged,
  $drafts,
  $identity,
  $inviteOpen,
  $inviteOpened,
} from '../../state';
import {
  $forgetContact,
  $noteAdvertisedName,
  $recordPeer,
  $renameContact,
  $restoreContacts,
} from '../contacts';
import { PEER_ID, SELF_ID, fakeContact } from './fixtures';

vi.mock('../../platform/database');

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(5_000);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const fakeSelf: SelfContact = {
  kind: 'self',
  endpointId: SELF_ID,
  label: 'My laptop',
  createdAt: 1,
};

describe('$restoreContacts', () => {
  it('lands the peers in the book and the self row in the identity', async () => {
    const contact = fakeContact();
    vi.mocked(readContacts).mockResolvedValue([contact, fakeSelf]);
    await using effects = createTestController();

    await effects.run($restoreContacts);
    const book = await effects.run($contacts);
    const self = await effects.run($identity);

    expect(book.entries).toEqual({ [PEER_ID]: contact });
    expect(self.record).toEqual(fakeSelf);
  });

  it('fails when the disk does', async () => {
    const error = new Error('Testing failures');
    vi.mocked(readContacts).mockRejectedValue(error);
    await using effects = createTestController();

    await expect(effects.run($restoreContacts)).rejects.toMatchObject({
      errors: [error],
    });
  });
});

describe('$recordPeer', () => {
  it('files a new peer and writes it through', async () => {
    await using effects = createTestController();
    const recordPeer = await effects.run($recordPeer);
    const book = await effects.run($contacts);

    await recordPeer(PEER_ID);

    const expected = fakeContact({ createdAt: 5_000, lastSeenAt: 5_000 });
    expect(book.entries[PEER_ID]).toEqual(expected);
    expect(saveContact).toHaveBeenCalledWith(expected);
  });

  it('writes a plain object, not the store proxy', async () => {
    await using effects = createTestController();
    const recordPeer = await effects.run($recordPeer);
    const book = await effects.run($contacts);

    await recordPeer(PEER_ID);

    expect(vi.mocked(saveContact).mock.calls[0][0]).not.toBe(
      book.entries[PEER_ID],
    );
  });

  it('only bumps the clock on a peer already known', async () => {
    await using effects = createTestController();
    const contactsRestored = await effects.run($contactsRestored);
    const recordPeer = await effects.run($recordPeer);
    const book = await effects.run($contacts);
    contactsRestored([fakeContact({ label: 'Phone' })]);

    await recordPeer(PEER_ID);

    expect(book.entries[PEER_ID]).toEqual(
      fakeContact({ label: 'Phone', lastSeenAt: 5_000 }),
    );
  });

  it('closes the invite, since somebody used it', async () => {
    await using effects = createTestController();
    const inviteOpened = await effects.run($inviteOpened);
    const recordPeer = await effects.run($recordPeer);
    const inviteOpen = await effects.run($inviteOpen);
    inviteOpened();

    await recordPeer(PEER_ID);

    expect(inviteOpen()).toBe(false);
  });

  it('fails when the write does', async () => {
    const error = new Error('Testing failures');
    vi.mocked(saveContact).mockRejectedValue(error);
    await using effects = createTestController();
    const recordPeer = await effects.run($recordPeer);

    await expect(recordPeer(PEER_ID)).rejects.toBe(error);
  });
});

describe('$renameContact', () => {
  it('renames and writes the normalized name through', async () => {
    await using effects = createTestController();
    const contactsRestored = await effects.run($contactsRestored);
    const renameContact = await effects.run($renameContact);
    contactsRestored([fakeContact()]);

    await renameContact(PEER_ID, '  Work phone  ');

    expect(saveContact).toHaveBeenCalledWith(
      fakeContact({ label: 'Work phone' }),
    );
  });

  it('clears the local name with `null`', async () => {
    await using effects = createTestController();
    const contactsRestored = await effects.run($contactsRestored);
    const renameContact = await effects.run($renameContact);
    const book = await effects.run($contacts);
    contactsRestored([fakeContact({ label: 'Old' })]);

    await renameContact(PEER_ID, null);

    expect(book.entries[PEER_ID].label).toBeNull();
  });

  it('writes nothing for a contact that isn’t there', async () => {
    await using effects = createTestController();
    const renameContact = await effects.run($renameContact);

    await renameContact(PEER_ID, 'Nobody');

    expect(saveContact).not.toHaveBeenCalled();
  });
});

describe('$noteAdvertisedName', () => {
  it('keeps the advertised name apart from the local one', async () => {
    await using effects = createTestController();
    const contactsRestored = await effects.run($contactsRestored);
    const noteAdvertisedName = await effects.run($noteAdvertisedName);
    contactsRestored([fakeContact({ label: 'Mine' })]);

    await noteAdvertisedName(PEER_ID, 'Theirs');

    expect(saveContact).toHaveBeenCalledWith(
      fakeContact({ label: 'Mine', suggestedLabel: 'Theirs' }),
    );
  });
});

describe('$forgetContact', () => {
  it('drops the contact and its draft, then deletes it from disk', async () => {
    await using effects = createTestController();
    const contactsRestored = await effects.run($contactsRestored);
    const draftChanged = await effects.run($draftChanged);
    const forgetContact = await effects.run($forgetContact);
    const book = await effects.run($contacts);
    const drafts = await effects.run($drafts);
    contactsRestored([fakeContact()]);
    draftChanged(PEER_ID, 'half a thought');

    await forgetContact(PEER_ID);

    expect(book.entries).toEqual({});
    expect(drafts.bodies).toEqual({});
    expect(removeContact).toHaveBeenCalledWith(PEER_ID);
  });

  it('fails when the delete does', async () => {
    const error = new Error('Testing failures');
    vi.mocked(removeContact).mockRejectedValue(error);
    await using effects = createTestController();
    const forgetContact = await effects.run($forgetContact);

    await expect(forgetContact(PEER_ID)).rejects.toBe(error);
  });
});
