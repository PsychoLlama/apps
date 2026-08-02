/**
 * Unit tests for the address book's folds — how a contact enters the book,
 * gets named, and leaves it. Everything here commits facts and asserts
 * state; nothing touches IndexedDB or a saga.
 */

import { createTestRuntime } from '@lib/state';
import {
  contactAdvertisedTopic,
  contactForgottenTopic,
  contactRenamedTopic,
  contactSeenTopic,
  contactsLoadFailedTopic,
  contactsLoadingTopic,
  contactsRestoredTopic,
  contactsStore,
} from '../contacts';
import type { Contact } from '../../platform/database';
import { LABEL_MAX_LENGTH } from '../../labels';
import { beamScope } from '../../scope';

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  kind: 'peer',
  endpointId: 'ep-1',
  label: null,
  suggestedLabel: null,
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('contactsStore', () => {
  it('seeds an unread, empty book', () => {
    const { peek } = setup();

    expect(peek(contactsStore).status).toBe('initial');
    expect(peek(contactsStore).entries).toEqual({});
  });
});

describe('contactsLoadingTopic', () => {
  it('marks the read under way', () => {
    const { commit, peek } = setup();

    commit(contactsLoadingTopic());

    expect(peek(contactsStore).status).toBe('loading');
  });
});

describe('contactsRestoredTopic', () => {
  it('keys the persisted contacts by endpoint', () => {
    const { commit, peek } = setup();
    const contact = fakeContact();

    commit(contactsRestoredTopic([contact]));

    expect(peek(contactsStore).status).toBe('ready');
    expect(peek(contactsStore).entries).toEqual({ 'ep-1': contact });
  });

  it('reads an empty book as ready, not missing', () => {
    const { commit, peek } = setup();

    commit(contactsRestoredTopic([]));

    expect(peek(contactsStore).status).toBe('ready');
  });
});

describe('contactsLoadFailedTopic', () => {
  it('keeps an unreadable book distinct from an empty one', () => {
    const { commit, peek } = setup();
    commit(contactsLoadingTopic());

    commit(contactsLoadFailedTopic());

    expect(peek(contactsStore).status).toBe('failed');
  });
});

describe('contactSeenTopic', () => {
  it('adds an unknown peer to the book', () => {
    const { commit, peek } = setup();

    commit(contactSeenTopic({ endpointId: 'ep-2', seenAt: 500 }));

    expect(peek(contactsStore).entries['ep-2']).toEqual({
      kind: 'peer',
      endpointId: 'ep-2',
      label: null,
      suggestedLabel: null,
      createdAt: 500,
      lastSeenAt: 500,
    });
  });

  it('only bumps the clock for a peer already in the book', () => {
    const { commit, peek } = setup();
    commit(
      contactsRestoredTopic([
        fakeContact({ label: 'Laptop', createdAt: 1, lastSeenAt: 1 }),
      ]),
    );

    commit(contactSeenTopic({ endpointId: 'ep-1', seenAt: 900 }));

    expect(peek(contactsStore).entries['ep-1']).toMatchObject({
      label: 'Laptop',
      // When the contact entered the book is the one thing a later sighting
      // can't restate, so meeting again must not overwrite it.
      createdAt: 1,
      lastSeenAt: 900,
    });
  });
});

describe('contactRenamedTopic', () => {
  it('records the local name', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact()]));

    commit(contactRenamedTopic({ endpointId: 'ep-1', label: 'Work phone' }));

    expect(peek(contactsStore).entries['ep-1'].label).toBe('Work phone');
  });

  it('clears the local name when the label is dropped', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact({ label: 'Work phone' })]));

    commit(contactRenamedTopic({ endpointId: 'ep-1', label: null }));

    expect(peek(contactsStore).entries['ep-1'].label).toBeNull();
  });

  it('ignores a rename for a contact that isn’t there', () => {
    const { commit, peek } = setup();

    commit(contactRenamedTopic({ endpointId: 'ep-9', label: 'Ghost' }));

    expect(peek(contactsStore).entries).toEqual({});
  });

  it('reads an emptied field as clearing the name', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact({ label: 'Work phone' })]));

    commit(contactRenamedTopic({ endpointId: 'ep-1', label: '   ' }));

    expect(peek(contactsStore).entries['ep-1'].label).toBeNull();
  });

  it('holds a typed name to the shared limit', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact()]));

    commit(
      contactRenamedTopic({
        endpointId: 'ep-1',
        label: 'x'.repeat(LABEL_MAX_LENGTH + 20),
      }),
    );

    // The field's `maxlength` is a courtesy to whoever is typing; this is
    // the rule, and it's the same one an advertised name is held to.
    expect(peek(contactsStore).entries['ep-1'].label).toHaveLength(
      LABEL_MAX_LENGTH,
    );
  });
});

describe('contactAdvertisedTopic', () => {
  it('records the name a peer suggested for itself', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact()]));

    commit(contactAdvertisedTopic({ endpointId: 'ep-1', label: 'Studio Mac' }));

    expect(peek(contactsStore).entries['ep-1'].suggestedLabel).toBe(
      'Studio Mac',
    );
  });

  it('never overwrites the name the reader typed', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact({ label: 'Work phone' })]));

    commit(contactAdvertisedTopic({ endpointId: 'ep-1', label: 'Studio Mac' }));

    expect(peek(contactsStore).entries['ep-1']).toMatchObject({
      label: 'Work phone',
      suggestedLabel: 'Studio Mac',
    });
  });

  it('caps a name that arrived from a stranger', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact()]));

    commit(
      contactAdvertisedTopic({
        endpointId: 'ep-1',
        label: 'z'.repeat(LABEL_MAX_LENGTH * 10),
      }),
    );

    expect(peek(contactsStore).entries['ep-1'].suggestedLabel).toHaveLength(
      LABEL_MAX_LENGTH,
    );
  });

  it('ignores a name for a contact that isn’t there', () => {
    const { commit, peek } = setup();

    commit(contactAdvertisedTopic({ endpointId: 'ep-9', label: 'Ghost' }));

    expect(peek(contactsStore).entries).toEqual({});
  });
});

describe('contactForgottenTopic', () => {
  it('drops the contact from the book', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact()]));

    commit(contactForgottenTopic('ep-1'));

    expect(peek(contactsStore).entries).toEqual({});
  });

  it('ignores a contact that was already gone', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeContact()]));

    commit(contactForgottenTopic('ep-9'));

    expect(peek(contactsStore).entries).toEqual({ 'ep-1': fakeContact() });
  });
});
