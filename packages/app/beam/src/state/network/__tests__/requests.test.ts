/**
 * Unit tests for pairing requests: who is still asking, and what makes the
 * prompt come back after it has been waved off.
 */

import { createTestRuntime } from '@lib/state';
import type { PeerConnection } from '@crate/p2p';
import type { PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import {
  pairingRequestsFormula,
  requestDismissedTopic,
  requestsStore,
} from '../requests';
import { peerLinkedTopic } from '../peers';
import { contactForgottenTopic, contactsRestoredTopic } from '../../contacts';
import type { Contact } from '../../platform/database';
import { beamScope } from '../../scope';

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  kind: 'peer',
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
  closed: new Promise(() => undefined),
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
