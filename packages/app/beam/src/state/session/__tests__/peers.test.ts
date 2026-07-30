/**
 * Unit tests for the peer-link folds — which peers this session can talk to
 * and which handles it holds open. The handles are wasm objects in
 * production; here they're stand-ins, because nothing in these folds does
 * anything with one but store it.
 */

import { createTestRuntime } from '@lib/state';
import type { PeerConnection } from '@crate/iroh';
import type { PeerLink } from '../capabilities';
import { createInbox } from '../inbox';
import {
  peerClosedTopic,
  peerDialingTopic,
  peerHandlesCell,
  peerLinkedTopic,
  peerLinksStore,
  peerReleasedTopic,
  peerUnreachableTopic,
} from '../peers';
import { beamScope } from '../../scope';

/**
 * A stand-in link. The folds only hold it; nothing calls into it, and
 * `closed` never settles because these tests commit the close themselves.
 */
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

    commit(peerLinkedTopic(link));

    expect(peek(peerLinksStore).statuses['ep-1']).toBe('linked');
    expect(peek(peerHandlesCell).get('ep-1')).toBe(link);
  });

  it('replaces an earlier link to the same peer', () => {
    const { commit, peek } = setup();
    const second = fakeLink();

    commit(peerLinkedTopic(fakeLink('ep-1')));
    commit(peerLinkedTopic(second));

    expect(peek(peerHandlesCell).get('ep-1')).toBe(second);
  });

  it('leaves other peers’ links alone', () => {
    const { commit, peek } = setup();
    const first = fakeLink();

    commit(peerLinkedTopic(first));
    commit(peerLinkedTopic(fakeLink('ep-2')));

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

describe('peerClosedTopic', () => {
  it('marks a peer that hung up and drops its handle', () => {
    const { commit, peek } = setup();
    const link = fakeLink();

    commit(peerLinkedTopic(link));
    commit(peerClosedTopic(link));

    // Distinct from absent: this device answered and then went, which is
    // what the share view says rather than pretending nothing was tried.
    expect(peek(peerLinksStore).statuses['ep-1']).toBe('closed');
    expect(peek(peerHandlesCell).has('ep-1')).toBe(false);
  });

  it('ignores a link that has already been replaced', () => {
    const { commit, peek } = setup();
    const stale = fakeLink();
    const current = fakeLink();

    commit(peerLinkedTopic(stale));
    commit(peerLinkedTopic(current));
    commit(peerClosedTopic(stale));

    // Replacing a link closes the one it replaced, so this fires for a
    // connection nothing points at any more. Acting on it would report the
    // live link as gone.
    expect(peek(peerLinksStore).statuses['ep-1']).toBe('linked');
    expect(peek(peerHandlesCell).get('ep-1')).toBe(current);
  });

  it('ignores a link this device let go on purpose', () => {
    const { commit, peek } = setup();
    const link = fakeLink();

    commit(peerLinkedTopic(link));
    commit(peerReleasedTopic('ep-1'));
    commit(peerClosedTopic(link));

    // Hanging up settles the same promise. A deliberate release means the
    // peer was dropped, not that it disconnected on us.
    expect(peek(peerLinksStore).statuses).toEqual({});
  });
});

describe('peerReleasedTopic', () => {
  it('drops the link and its handle', () => {
    const { commit, peek } = setup();

    commit(peerLinkedTopic(fakeLink('ep-1')));
    commit(peerReleasedTopic('ep-1'));

    expect(peek(peerLinksStore).statuses).toEqual({});
    expect(peek(peerHandlesCell).has('ep-1')).toBe(false);
  });
});
