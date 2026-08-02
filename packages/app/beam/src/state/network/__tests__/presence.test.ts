/**
 * Unit tests for the presence views: who can be shared with right now, and
 * how one peer's standing reads once the transport and the pairing are taken
 * together.
 */

import { createTestRuntime } from '@lib/state';
import type { PeerConnection } from '@crate/p2p';
import type { PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import { activePeersFormula, peerStatesFormula } from '../presence';
import {
  peerDialingTopic,
  peerLinkedTopic,
  peerUnreachableTopic,
} from '../peers';
import { contactsRestoredTopic } from '../../contacts';
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

describe('activePeersFormula', () => {
  it('marks a paired device with a live link', () => {
    const { commit, peek } = setup([fakeContact({ trust: 'trusted' })]);

    commit(peerLinkedTopic(fakeLink('ep-1')));

    expect(peek(activePeersFormula)).toEqual({ 'ep-1': true });
  });

  it('ignores a paired device nothing has reached', () => {
    const { peek } = setup([fakeContact({ trust: 'trusted' })]);

    // Empty at every first paint: nothing is linked until something dials.
    expect(peek(activePeersFormula)).toEqual({});
  });

  it('ignores a linked peer that hasn’t accepted', () => {
    const { commit, peek } = setup([fakeContact({ trust: 'invited' })]);

    commit(peerLinkedTopic(fakeLink('ep-1')));

    // A link isn't permission. Nothing can be shared with this one yet.
    expect(peek(activePeersFormula)).toEqual({});
  });

  it('ignores a peer whose dial never landed', () => {
    const { commit, peek } = setup([fakeContact({ trust: 'trusted' })]);

    commit(peerUnreachableTopic('ep-1'));

    expect(peek(activePeersFormula)).toEqual({});
  });
});

describe('peerStatesFormula', () => {
  it('says nothing about a peer nothing has happened with', () => {
    const { peek } = setup([fakeContact()]);

    // The view reads an absent entry as `preparing`, which is right for a
    // cold load and for the paint before the endpoint is up.
    expect(peek(peerStatesFormula)['ep-1']).toBeUndefined();
  });

  it('reads a dial in flight as connecting', () => {
    const { commit, peek } = setup([fakeContact()]);

    commit(peerDialingTopic('ep-1'));

    expect(peek(peerStatesFormula)['ep-1']).toBe('connecting');
  });

  it('reads a link to an unanswered invite as awaiting', () => {
    const { commit, peek } = setup([
      fakeContact({ trust: 'invited', direction: 'outbound' }),
    ]);

    commit(peerLinkedTopic(fakeLink('ep-1')));

    expect(peek(peerStatesFormula)['ep-1']).toBe('awaiting');
  });

  it('reads a link to a paired peer as connected', () => {
    const { commit, peek } = setup([fakeContact({ trust: 'trusted' })]);

    commit(peerLinkedTopic(fakeLink('ep-1')));

    expect(peek(peerStatesFormula)['ep-1']).toBe('connected');
  });

  it('reads a failed dial as unreachable', () => {
    const { commit, peek } = setup([fakeContact()]);

    commit(peerUnreachableTopic('ep-1'));

    expect(peek(peerStatesFormula)['ep-1']).toBe('unreachable');
  });

  it('follows the pairing up without a second link', () => {
    const { commit, peek } = setup([
      fakeContact({ trust: 'invited', direction: 'outbound' }),
    ]);
    commit(peerLinkedTopic(fakeLink('ep-1')));

    commit(contactsRestoredTopic([fakeContact({ trust: 'trusted' })]));

    // Acceptance arrives over the link that's already up, so the view has to
    // move without anything happening to the transport.
    expect(peek(peerStatesFormula)['ep-1']).toBe('connected');
  });
});
