/**
 * Unit tests for the address book's commands — how a contact enters the
 * book, gets named, and leaves it — and the derivation the UI reads it by.
 */

import { createTestController } from '@lib/effects/testing';
import type { Contact, SelfContact } from '../../platform/database';
import {
  $contactAdvertised,
  $contactForgotten,
  $contactRenamed,
  $contacts,
  $contactSeen,
  $contactsRestored,
  addressBookOf,
  fallbackName,
  type ContactBook,
} from '../contacts';
import {
  $inviteOpen,
  $inviteOpened,
  $renameTarget,
  $renameOpened,
} from '../dialogs';
import { $identity } from '../identity';
import { LABEL_MAX_LENGTH } from '../labels';
import { $draftChanged, $drafts, $shareLog, $shareReceived } from '../shares';

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  kind: 'peer',
  endpointId: 'ep-1',
  label: null,
  suggestedLabel: null,
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

const fakeSelf: SelfContact = {
  kind: 'self',
  endpointId: 'ep-self',
  label: 'My laptop',
  createdAt: 1,
};

const bookOf = (...contacts: Contact[]): ContactBook => ({
  entries: Object.fromEntries(
    contacts.map((contact) => [contact.endpointId, contact]),
  ),
});

describe('$contacts', () => {
  it('seeds an empty book', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);

    expect(book.entries).toEqual({});
  });
});

describe('$contactsRestored', () => {
  it('keys the persisted contacts by endpoint', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const contactsRestored = await effects.run($contactsRestored);
    const contact = fakeContact();

    contactsRestored([contact]);

    expect(book.entries).toEqual({ 'ep-1': contact });
  });

  it('files this device’s row under the identity, not the book', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const self = await effects.run($identity);
    const contactsRestored = await effects.run($contactsRestored);

    contactsRestored([fakeContact(), fakeSelf]);

    expect(Object.keys(book.entries)).toEqual(['ep-1']);
    expect(self.record).toEqual(fakeSelf);
  });

  it('reads a store with no self row as a device nobody has named', async () => {
    await using effects = createTestController();
    const self = await effects.run($identity);
    const contactsRestored = await effects.run($contactsRestored);

    contactsRestored([fakeContact()]);

    expect(self.record).toBeNull();
  });
});

describe('$contactSeen', () => {
  it('adds an unknown peer to the book', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const contactSeen = await effects.run($contactSeen);

    contactSeen('ep-1', 5);

    expect(book.entries['ep-1']).toEqual(
      fakeContact({ createdAt: 5, lastSeenAt: 5 }),
    );
  });

  it('only bumps the clock for a peer already in the book', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const contactSeen = await effects.run($contactSeen);

    contactSeen('ep-1', 5);
    contactSeen('ep-1', 9);

    expect(book.entries['ep-1']).toMatchObject({ createdAt: 5, lastSeenAt: 9 });
  });

  it('closes the invite, whose errand is done', async () => {
    await using effects = createTestController();
    const inviteOpen = await effects.run($inviteOpen);
    const contactSeen = await effects.run($contactSeen);
    const inviteOpened = await effects.run($inviteOpened);
    inviteOpened();

    contactSeen('ep-1', 5);

    expect(inviteOpen()).toBe(false);
  });
});

describe('$contactRenamed', () => {
  const setup = async (effects: ReturnType<typeof createTestController>) => {
    const book = await effects.run($contacts);
    const renameTarget = await effects.run($renameTarget);
    const renameOpened = await effects.run($renameOpened);
    const contactSeen = await effects.run($contactSeen);
    const contactRenamed = await effects.run($contactRenamed);
    contactSeen('ep-1', 1);

    return { book, renameTarget, renameOpened, contactRenamed };
  };

  it('records the local name', async () => {
    await using effects = createTestController();
    const { book, contactRenamed } = await setup(effects);

    contactRenamed('ep-1', 'Work phone');

    expect(book.entries['ep-1']?.label).toBe('Work phone');
  });

  it('clears the local name when the label is dropped', async () => {
    await using effects = createTestController();
    const { book, contactRenamed } = await setup(effects);

    contactRenamed('ep-1', 'Work phone');
    contactRenamed('ep-1', null);

    expect(book.entries['ep-1']?.label).toBeNull();
  });

  it('reads an emptied field as clearing the name', async () => {
    await using effects = createTestController();
    const { book, contactRenamed } = await setup(effects);

    contactRenamed('ep-1', 'Work phone');
    contactRenamed('ep-1', '   ');

    expect(book.entries['ep-1']?.label).toBeNull();
  });

  it('holds a typed name to the shared limit', async () => {
    await using effects = createTestController();
    const { book, contactRenamed } = await setup(effects);

    contactRenamed('ep-1', 'x'.repeat(LABEL_MAX_LENGTH + 10));

    expect(book.entries['ep-1']?.label).toHaveLength(LABEL_MAX_LENGTH);
  });

  it('ignores a rename for a contact that isn’t there', async () => {
    await using effects = createTestController();
    const { book, contactRenamed } = await setup(effects);

    contactRenamed('ep-9', 'Ghost');

    expect(book.entries['ep-9']).toBeUndefined();
  });

  it('closes a rename form open over that contact', async () => {
    await using effects = createTestController();
    const { renameTarget, renameOpened, contactRenamed } = await setup(effects);
    renameOpened({ kind: 'peer', endpointId: 'ep-1' });

    contactRenamed('ep-1', 'Work phone');

    expect(renameTarget()).toBeNull();
  });

  it('leaves a form open over another contact', async () => {
    await using effects = createTestController();
    const { renameTarget, renameOpened, contactRenamed } = await setup(effects);
    renameOpened({ kind: 'peer', endpointId: 'ep-2' });

    contactRenamed('ep-1', 'Work phone');

    expect(renameTarget()).toEqual({ kind: 'peer', endpointId: 'ep-2' });
  });

  it('leaves this device’s form open', async () => {
    await using effects = createTestController();
    const { renameTarget, renameOpened, contactRenamed } = await setup(effects);
    renameOpened({ kind: 'self' });

    contactRenamed('ep-1', 'Work phone');

    expect(renameTarget()).toEqual({ kind: 'self' });
  });
});

describe('$contactAdvertised', () => {
  it('records the name a peer suggested for itself', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const contactSeen = await effects.run($contactSeen);
    const contactAdvertised = await effects.run($contactAdvertised);
    contactSeen('ep-1', 1);

    contactAdvertised('ep-1', 'Carol’s Phone');

    expect(book.entries['ep-1']?.suggestedLabel).toBe('Carol’s Phone');
  });

  it('never overwrites the name the reader typed', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const contactSeen = await effects.run($contactSeen);
    const contactRenamed = await effects.run($contactRenamed);
    const contactAdvertised = await effects.run($contactAdvertised);
    contactSeen('ep-1', 1);
    contactRenamed('ep-1', 'Mine');

    contactAdvertised('ep-1', 'Theirs');

    expect(book.entries['ep-1']).toMatchObject({
      label: 'Mine',
      suggestedLabel: 'Theirs',
    });
  });

  it('caps a name that arrived from a stranger', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const contactSeen = await effects.run($contactSeen);
    const contactAdvertised = await effects.run($contactAdvertised);
    contactSeen('ep-1', 1);

    contactAdvertised('ep-1', 'x'.repeat(LABEL_MAX_LENGTH * 2));

    expect(book.entries['ep-1']?.suggestedLabel).toHaveLength(LABEL_MAX_LENGTH);
  });

  it('ignores a name for a contact that isn’t there', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const contactAdvertised = await effects.run($contactAdvertised);

    contactAdvertised('ep-9', 'Ghost');

    expect(book.entries).toEqual({});
  });
});

describe('$contactForgotten', () => {
  it('drops the contact, its draft, and its shares', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const drafts = await effects.run($drafts);
    const log = await effects.run($shareLog);
    const contactSeen = await effects.run($contactSeen);
    const contactForgotten = await effects.run($contactForgotten);
    contactSeen('ep-1', 1);
    contactSeen('ep-2', 1);
    const draftChanged = await effects.run($draftChanged);
    const shareReceived = await effects.run($shareReceived);
    draftChanged('ep-1', 'half-written');
    draftChanged('ep-2', 'kept');
    shareReceived({ id: 's1', endpointId: 'ep-1', body: 'a', at: 1 });
    shareReceived({ id: 's2', endpointId: 'ep-2', body: 'b', at: 2 });

    contactForgotten('ep-1');

    expect(Object.keys(book.entries)).toEqual(['ep-2']);
    expect(drafts.bodies).toEqual({ 'ep-2': 'kept' });
    expect(log.items.map((share) => share.id)).toEqual(['s2']);
  });

  it('ignores a contact that was already gone', async () => {
    await using effects = createTestController();
    const book = await effects.run($contacts);
    const contactForgotten = await effects.run($contactForgotten);

    contactForgotten('ep-9');

    expect(book.entries).toEqual({});
  });
});

describe('fallbackName', () => {
  it('prefers the advertised name', () => {
    expect(fallbackName(fakeContact({ suggestedLabel: 'Theirs' }))).toBe(
      'Theirs',
    );
  });

  it('falls back to the key prefix', () => {
    expect(fallbackName(fakeContact({ endpointId: 'abcdef0123456789' }))).toBe(
      'abcdef01',
    );
  });
});

describe('addressBookOf', () => {
  it('is empty before anything is paired', () => {
    expect(addressBookOf(bookOf())).toEqual([]);
  });

  it('prefers the local name over everything else', () => {
    const book = bookOf(fakeContact({ label: 'Mine', suggestedLabel: 'X' }));

    expect(addressBookOf(book)[0]?.name).toBe('Mine');
  });

  it('falls back to the advertised name, then the key', () => {
    const book = bookOf(
      fakeContact({ endpointId: 'aaaaaaaa11', suggestedLabel: 'Theirs' }),
      fakeContact({ endpointId: 'bbbbbbbb22' }),
    );

    expect(addressBookOf(book).map((view) => view.name)).toEqual([
      'bbbbbbbb',
      'Theirs',
    ]);
  });

  it('sorts by name so the list holds still', () => {
    const book = bookOf(
      fakeContact({ endpointId: 'ep-1', label: 'Zed' }),
      fakeContact({ endpointId: 'ep-2', label: 'Amy' }),
    );

    expect(addressBookOf(book).map((view) => view.name)).toEqual([
      'Amy',
      'Zed',
    ]);
  });

  it('breaks a tie on the endpoint id, and keeps both', () => {
    const book = bookOf(
      fakeContact({ endpointId: 'ep-2', label: 'Same' }),
      fakeContact({ endpointId: 'ep-1', label: 'Same' }),
    );

    expect(addressBookOf(book).map((view) => view.endpointId)).toEqual([
      'ep-1',
      'ep-2',
    ]);
  });

  it('carries the fields a row renders from', () => {
    const book = bookOf(fakeContact({ label: 'Mine', createdAt: 42 }));

    expect(addressBookOf(book)).toEqual([
      { endpointId: 'ep-1', name: 'Mine', createdAt: 42 },
    ]);
  });
});
