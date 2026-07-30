/**
 * Unit tests for the pairing views: which peers are asking, and how the
 * share page reads a pairing that's half-transport and half-trust.
 */

import { createTestRuntime } from '@lib/state';
import type { PeerConnection } from '@crate/iroh';
import type { PeerLink } from '../capabilities';
import { createInbox } from '../inbox';
import {
  activeContactsFormula,
  pairingRequestsFormula,
  requestDismissedTopic,
  requestsStore,
  shareStatesFormula,
} from '../pairing';
import {
  peerDialingTopic,
  peerLinkedTopic,
  peerUnreachableTopic,
} from '../peers';
import {
  contactForgottenTopic,
  contactsRestoredTopic,
} from '../../contacts/contacts';
import type { Contact } from '../../contacts/database';
import { beamScope } from '../../scope';

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  endpointId: 'ep-1',
  label: null,
  suggestedLabel: null,
  trust: 'invited',
  direction: 'inbound',
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

/** A stand-in link. Nothing here calls into one. */
const fakeLink = (endpointId = 'ep-1'): PeerLink => ({
  endpointId,
  connection: {} as PeerConnection,
  messages: createInbox(),
  release: () => undefined,
});

const setup = (contacts: Contact[] = []) => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  runtime.commit(contactsRestoredTopic(contacts));
  return runtime;
};

describe('pairingRequestsFormula', () => {
  it('surfaces a peer waiting on an answer', () => {
    const { peek } = setup([fakeContact({ label: 'Studio Mac' })]);

    expect(peek(pairingRequestsFormula)).toMatchObject([
      { endpointId: 'ep-1', name: 'Studio Mac' },
    ]);
  });

  it('ignores a peer we invited', () => {
    const { peek } = setup([fakeContact({ direction: 'outbound' })]);

    // We're the ones waiting there; there's nothing for the reader to answer.
    expect(peek(pairingRequestsFormula)).toEqual([]);
  });

  it('ignores a peer already paired', () => {
    const { peek } = setup([fakeContact({ trust: 'trusted' })]);

    expect(peek(pairingRequestsFormula)).toEqual([]);
  });

  it('stops asking once the request is waved off', () => {
    const { commit, peek } = setup([fakeContact()]);

    commit(requestDismissedTopic('ep-1'));

    expect(peek(pairingRequestsFormula)).toEqual([]);
  });

  it('leaves the contact in place when a request is waved off', () => {
    const { commit, peek } = setup([fakeContact()]);

    commit(requestDismissedTopic('ep-1'));

    // Refusing is inaction. Nothing is granted and nothing is resolved, so
    // the contact page can still answer it against the endpoint key.
    expect(peek(requestsStore).dismissed).toEqual({ 'ep-1': true });
  });

  it('asks again when the peer dials in again', () => {
    const { commit, peek } = setup([fakeContact()]);
    commit(requestDismissedTopic('ep-1'));

    commit(peerLinkedTopic(fakeLink('ep-1')));

    // A fresh ask, not a bypass: the contact is still `invited`, and the
    // prompt is the same prompt.
    expect(peek(pairingRequestsFormula)).toMatchObject([
      { endpointId: 'ep-1', trust: 'invited' },
    ]);
  });

  it('lets a dismissal go when the contact is forgotten', () => {
    const { commit, peek } = setup([fakeContact()]);
    commit(requestDismissedTopic('ep-1'));

    commit(contactForgottenTopic('ep-1'));

    expect(peek(requestsStore).dismissed).toEqual({});
  });

  it('queues several peers oldest first', () => {
    const { peek } = setup([
      fakeContact({ endpointId: 'ep-2', label: 'Aardvark', createdAt: 20 }),
      fakeContact({ endpointId: 'ep-1', label: 'Zebra', createdAt: 10 }),
    ]);

    // Arrival order, not the address book's alphabetical sort: these are
    // unanswered questions, and the one waiting longest comes first.
    expect(peek(pairingRequestsFormula)).toMatchObject([
      { endpointId: 'ep-1' },
      { endpointId: 'ep-2' },
    ]);
  });

  it('surfaces a request that outlived the session it arrived in', () => {
    // An invite is persisted precisely so it survives a reload; a request
    // answerable only while the other device is awake is one you'd miss.
    const { peek } = setup([fakeContact()]);

    expect(peek(pairingRequestsFormula)).toHaveLength(1);
  });
});

describe('activeContactsFormula', () => {
  it('surfaces a paired device with a live link', () => {
    const { commit, peek } = setup([
      fakeContact({ trust: 'trusted', label: 'Studio Mac' }),
    ]);

    commit(peerLinkedTopic(fakeLink('ep-1')));

    expect(peek(activeContactsFormula)).toMatchObject([{ name: 'Studio Mac' }]);
  });

  it('ignores a paired device nothing has reached', () => {
    const { peek } = setup([fakeContact({ trust: 'trusted' })]);

    // Empty at every first paint: nothing is linked until something dials.
    expect(peek(activeContactsFormula)).toEqual([]);
  });

  it('ignores a linked peer that hasn’t accepted', () => {
    const { commit, peek } = setup([fakeContact({ trust: 'invited' })]);

    commit(peerLinkedTopic(fakeLink('ep-1')));

    // A link isn't permission. Nothing can be shared with this one yet.
    expect(peek(activeContactsFormula)).toEqual([]);
  });

  it('ignores a peer whose dial never landed', () => {
    const { commit, peek } = setup([fakeContact({ trust: 'trusted' })]);

    commit(peerUnreachableTopic('ep-1'));

    expect(peek(activeContactsFormula)).toEqual([]);
  });
});

describe('shareStatesFormula', () => {
  it('says nothing about a peer nothing has happened with', () => {
    const { peek } = setup([fakeContact()]);

    // The view reads an absent entry as `preparing`, which is right for a
    // cold load and for the paint before the endpoint is up.
    expect(peek(shareStatesFormula)['ep-1']).toBeUndefined();
  });

  it('reads a dial in flight as connecting', () => {
    const { commit, peek } = setup([fakeContact()]);

    commit(peerDialingTopic('ep-1'));

    expect(peek(shareStatesFormula)['ep-1']).toBe('connecting');
  });

  it('reads a link to an unanswered invite as awaiting', () => {
    const { commit, peek } = setup([
      fakeContact({ trust: 'invited', direction: 'outbound' }),
    ]);

    commit(peerLinkedTopic(fakeLink('ep-1')));

    expect(peek(shareStatesFormula)['ep-1']).toBe('awaiting');
  });

  it('reads a link to a paired peer as connected', () => {
    const { commit, peek } = setup([fakeContact({ trust: 'trusted' })]);

    commit(peerLinkedTopic(fakeLink('ep-1')));

    expect(peek(shareStatesFormula)['ep-1']).toBe('connected');
  });

  it('reads a failed dial as unreachable', () => {
    const { commit, peek } = setup([fakeContact()]);

    commit(peerUnreachableTopic('ep-1'));

    expect(peek(shareStatesFormula)['ep-1']).toBe('unreachable');
  });

  it('follows the pairing up without a second link', () => {
    const { commit, peek } = setup([
      fakeContact({ trust: 'invited', direction: 'outbound' }),
    ]);
    commit(peerLinkedTopic(fakeLink('ep-1')));

    commit(contactsRestoredTopic([fakeContact({ trust: 'trusted' })]));

    // Acceptance arrives over the link that's already up, so the view has to
    // move without anything happening to the transport.
    expect(peek(shareStatesFormula)['ep-1']).toBe('connected');
  });
});
