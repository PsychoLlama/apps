/**
 * Unit tests for the peer-link folds — which peers this session can talk to
 * and which handles it holds open. The handles are wasm objects in
 * production; here they're stand-ins, because nothing in these folds does
 * anything with one but store it.
 */

import { createTestRuntime } from '@lib/state';
import type { PeerConnection } from '@crate/iroh';
import {
  peerDialingTopic,
  peerHandlesCell,
  peerLinkedTopic,
  peerLinksStore,
  peerReleasedTopic,
  peerUnreachableTopic,
} from '../peers';
import { beamScope } from '../../scope';

/** A stand-in link. The folds only hold it; nothing calls into it. */
const fakeLink = (): PeerConnection => ({}) as PeerConnection;

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('peerLinksStore', () => {
  it('starts with nothing attempted', () => {
    const { peek } = setup();

    expect(peek(peerLinksStore).statuses).toEqual({});
  });
});

describe('peerDialingTopic', () => {
  it('marks the dial in flight', () => {
    const { commit, peek } = setup();

    commit(peerDialingTopic('ep-1'));

    expect(peek(peerLinksStore).statuses['ep-1']).toBe('dialing');
  });
});

describe('peerLinkedTopic', () => {
  it('marks the peer linked and holds its handle', () => {
    const { commit, peek } = setup();
    const link = fakeLink();

    commit(peerLinkedTopic({ endpointId: 'ep-1', link }));

    expect(peek(peerLinksStore).statuses['ep-1']).toBe('linked');
    expect(peek(peerHandlesCell).get('ep-1')).toBe(link);
  });

  it('replaces an earlier link to the same peer', () => {
    const { commit, peek } = setup();
    const second = fakeLink();

    commit(peerLinkedTopic({ endpointId: 'ep-1', link: fakeLink() }));
    commit(peerLinkedTopic({ endpointId: 'ep-1', link: second }));

    expect(peek(peerHandlesCell).get('ep-1')).toBe(second);
  });

  it('leaves other peers’ links alone', () => {
    const { commit, peek } = setup();
    const first = fakeLink();

    commit(peerLinkedTopic({ endpointId: 'ep-1', link: first }));
    commit(peerLinkedTopic({ endpointId: 'ep-2', link: fakeLink() }));

    expect(peek(peerHandlesCell).get('ep-1')).toBe(first);
  });
});

describe('peerUnreachableTopic', () => {
  it('records a dial that didn’t land', () => {
    const { commit, peek } = setup();

    commit(peerDialingTopic('ep-1'));
    commit(peerUnreachableTopic('ep-1'));

    expect(peek(peerLinksStore).statuses['ep-1']).toBe('unreachable');
  });
});

describe('peerReleasedTopic', () => {
  it('drops the link and its handle', () => {
    const { commit, peek } = setup();

    commit(peerLinkedTopic({ endpointId: 'ep-1', link: fakeLink() }));
    commit(peerReleasedTopic('ep-1'));

    expect(peek(peerLinksStore).statuses).toEqual({});
    expect(peek(peerHandlesCell).has('ep-1')).toBe(false);
  });
});
