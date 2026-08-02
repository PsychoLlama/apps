/**
 * Unit tests for this device's own record: the folds that settle it, the
 * guard that keeps it out of the address book, and the formulas that decide
 * what to show before anybody has named it.
 */

import { createTestRuntime } from '@lib/state';
import {
  deviceNamedTopic,
  identityResolvedTopic,
  identityStore,
} from '../identity';
import { deviceFallbackFormula, deviceNameFormula } from '../formulas';
import {
  addressBookFormula,
  contactsRestoredTopic,
  contactsStore,
} from '../../contacts';
import { generateLabel } from '../../labels';
import { beamScope } from '../../scope';
import type { Contact, SelfContact } from '../../platform/database';

const SELF_ID = `e1${'0'.repeat(62)}`;
const PEER_ID = `e2${'0'.repeat(62)}`;

const fakeSelf = (overrides: Partial<SelfContact> = {}): SelfContact => ({
  kind: 'self',
  endpointId: SELF_ID,
  label: 'Studio',
  createdAt: 1,
  ...overrides,
});

const fakePeer = (overrides: Partial<Contact> = {}): Contact => ({
  kind: 'peer',
  endpointId: PEER_ID,
  label: null,
  suggestedLabel: null,
  trust: 'invited',
  direction: 'outbound',
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('contactsRestoredTopic', () => {
  it('takes this device out of the peers it arrived with', () => {
    const { commit, peek } = setup();

    // One table, one read, two destinations. Everything that reaches into the
    // address book is asking about somebody else.
    commit(contactsRestoredTopic([fakePeer(), fakeSelf()]));

    expect(peek(identityStore).record).toEqual(fakeSelf());
    expect(Object.keys(peek(contactsStore).entries)).toEqual([PEER_ID]);
  });

  it('keeps this device out of the address book', () => {
    const { commit, peek } = setup();

    commit(contactsRestoredTopic([fakeSelf()]));

    // The one thing the shared table must never cost: a contact row for the
    // device the reader is holding.
    expect(peek(addressBookFormula)).toEqual([]);
  });

  it('reads a store with no self row as a device nobody has named', () => {
    const { commit, peek } = setup();

    commit(contactsRestoredTopic([fakePeer()]));

    expect(peek(identityStore).record).toBeNull();
  });
});

describe('deviceNamedTopic', () => {
  it('writes the name against this device’s address', () => {
    const { commit, peek } = setup();

    commit(
      deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1234 }),
    );

    expect(peek(identityStore).record).toEqual({
      kind: 'self',
      endpointId: SELF_ID,
      label: 'Studio',
      createdAt: 1234,
    });
  });

  it('normalizes the name on the way in', () => {
    const { commit, peek } = setup();

    commit(
      deviceNamedTopic({ endpointId: SELF_ID, label: '  Studio  ', at: 1234 }),
    );

    expect(peek(identityStore).record?.label).toBe('Studio');
  });

  it('clears the name when the field is emptied', () => {
    const { commit, peek } = setup();
    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1 }));

    commit(deviceNamedTopic({ endpointId: SELF_ID, label: '  ', at: 2 }));

    // Cleared rather than stored as a blank. A device carrying an empty
    // string tells every peer it's called nothing at all; a device carrying
    // `null` falls back to the prefix of its own key.
    expect(peek(identityStore).record?.label).toBeNull();
  });

  it('clears the name when it is dropped outright', () => {
    const { commit, peek } = setup();
    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1 }));

    commit(deviceNamedTopic({ endpointId: SELF_ID, label: null, at: 2 }));

    expect(peek(identityStore).record?.label).toBeNull();
  });

  it('keeps the date the device was first named', () => {
    const { commit, peek } = setup();
    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1 }));

    commit(
      deviceNamedTopic({ endpointId: SELF_ID, label: 'Kitchen', at: 999 }),
    );

    // A device named twice is the same device, and `createdAt` is when it
    // first became one.
    expect(peek(identityStore).record?.createdAt).toBe(1);
  });

  it('moves the row when the key underneath it changed', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeSelf({ endpointId: 'old-key' })]));

    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 2 }));

    // The name belongs to the device rather than to the key it happens to
    // hold, and there is only ever one row for it.
    expect(peek(identityStore).record?.endpointId).toBe(SELF_ID);
  });

  it('never adds a contact for this device', () => {
    const { commit, peek } = setup();

    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1 }));

    expect(peek(addressBookFormula)).toEqual([]);
  });
});

describe('deviceNameFormula', () => {
  it('has nothing to say before the key lands', () => {
    const { commit, peek } = setup();

    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1 }));

    // A name with no address behind it isn't yet a device anyone can reach.
    expect(peek(deviceNameFormula)).toBeNull();
  });

  it('answers with the name the reader chose', () => {
    const { commit, peek } = setup();
    commit(identityResolvedTopic(SELF_ID));

    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1 }));

    expect(peek(deviceNameFormula)).toBe('Studio');
  });

  it('falls back to the key prefix until somebody names it', () => {
    const { commit, peek } = setup();

    commit(identityResolvedTopic(SELF_ID));

    // Derived from the key, so it needs no exchange to agree on, and it's the
    // same name an unnamed contact wears — a device that reaches a peer
    // before anyone named it still arrives as somebody.
    expect(peek(deviceNameFormula)).toBe(generateLabel(SELF_ID));
  });

  it('names this device from the key it answers on now', () => {
    const { commit, peek } = setup();
    commit(contactsRestoredTopic([fakeSelf({ endpointId: 'old-key' })]));

    commit(identityResolvedTopic(SELF_ID));

    // The row remembers where the key was when the name was typed; peers dial
    // the live one.
    expect(peek(deviceNameFormula)).toBe('Studio');
  });

  it('goes back to the key prefix once the name is cleared', () => {
    const { commit, peek } = setup();
    commit(identityResolvedTopic(SELF_ID));
    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1 }));

    commit(deviceNamedTopic({ endpointId: SELF_ID, label: null, at: 2 }));

    expect(peek(deviceNameFormula)).toBe(generateLabel(SELF_ID));
  });
});

describe('deviceFallbackFormula', () => {
  it('has nothing to fall back to before the key lands', () => {
    const { peek } = setup();

    expect(peek(deviceFallbackFormula)).toBe('');
  });

  it('answers with the key prefix, named or not', () => {
    const { commit, peek } = setup();
    commit(identityResolvedTopic(SELF_ID));

    commit(deviceNamedTopic({ endpointId: SELF_ID, label: 'Studio', at: 1 }));

    // What clearing the name would get you, which is what the rename form
    // promises in its placeholder — so it can't be the name already typed.
    expect(peek(deviceFallbackFormula)).toBe(generateLabel(SELF_ID));
  });
});
