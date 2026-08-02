/**
 * Unit tests for the presence views: who can be shared with right now, and
 * how one peer's connection reads. Both answer from the link statuses alone
 * — the address book has no say in either.
 */

import { createTestRuntime } from '@lib/state';
import type { PeerConnection } from '@crate/p2p';
import type { PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import { activePeersFormula, peerStatesFormula } from '../presence';
import {
  peerClosedTopic,
  peerDialingTopic,
  peerLinkedTopic,
  peerUnreachableTopic,
} from '../peers';
import { beamScope } from '../../scope';

/** A stand-in link. Nothing here calls into one. */
const fakeLink = (endpointId = 'ep-1'): PeerLink => ({
  endpointId,
  connection: {} as PeerConnection,
  messages: createInbox(),
  closed: new Promise(() => undefined),
  release: () => undefined,
});

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('activePeersFormula', () => {
  it('marks a device with a live link', () => {
    const { commit, peek } = setup();

    commit(peerLinkedTopic(fakeLink('ep-1')));

    expect(peek(activePeersFormula)).toEqual({ 'ep-1': true });
  });

  it('holds nothing until something dials', () => {
    const { peek } = setup();

    // Empty at every first paint.
    expect(peek(activePeersFormula)).toEqual({});
  });

  it('ignores a peer whose dial never landed', () => {
    const { commit, peek } = setup();

    commit(peerUnreachableTopic('ep-1'));

    expect(peek(activePeersFormula)).toEqual({});
  });

  it('drops a peer whose link ended', () => {
    const { commit, peek } = setup();
    const link = fakeLink('ep-1');
    commit(peerLinkedTopic(link));

    commit(peerClosedTopic(link));

    // Reachability is the live link and nothing else, so hanging up takes it
    // away the moment it happens.
    expect(peek(activePeersFormula)).toEqual({});
  });
});

describe('peerStatesFormula', () => {
  it('says nothing about a peer nothing has happened with', () => {
    const { peek } = setup();

    // The view reads an absent entry as `preparing`, which is right for a
    // cold load and for the paint before the endpoint is up.
    expect(peek(peerStatesFormula)['ep-1']).toBeUndefined();
  });

  it('reads a dial in flight as connecting', () => {
    const { commit, peek } = setup();

    commit(peerDialingTopic('ep-1'));

    expect(peek(peerStatesFormula)['ep-1']).toBe('connecting');
  });

  it('reads a live link as connected', () => {
    const { commit, peek } = setup();

    commit(peerLinkedTopic(fakeLink('ep-1')));

    expect(peek(peerStatesFormula)['ep-1']).toBe('connected');
  });

  it('reads a failed dial as unreachable', () => {
    const { commit, peek } = setup();

    commit(peerUnreachableTopic('ep-1'));

    expect(peek(peerStatesFormula)['ep-1']).toBe('unreachable');
  });

  it('reads a link that ended as disconnected', () => {
    const { commit, peek } = setup();
    const link = fakeLink('ep-1');
    commit(peerLinkedTopic(link));

    commit(peerClosedTopic(link));

    expect(peek(peerStatesFormula)['ep-1']).toBe('disconnected');
  });
});
