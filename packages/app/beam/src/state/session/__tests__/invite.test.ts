/**
 * Unit tests for the invite dialog's visibility. Trivial on its own, but the
 * flag lives in the scope rather than the component, so it's worth pinning
 * that a dismissal actually lands rather than being swallowed.
 */

import { createTestRuntime } from '@lib/state';
import { inviteClosedTopic, inviteOpenedTopic, inviteStore } from '../invite';
import { contactSeenTopic } from '../../contacts/contacts';
import { beamScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('inviteStore', () => {
  it('starts out of the way', () => {
    const { peek } = setup();

    expect(peek(inviteStore).open).toBe(false);
  });

  it('opens on request', () => {
    const { commit, peek } = setup();

    commit(inviteOpenedTopic());

    expect(peek(inviteStore).open).toBe(true);
  });

  it('closes again on dismissal', () => {
    const { commit, peek } = setup();
    commit(inviteOpenedTopic());

    commit(inviteClosedTopic());

    expect(peek(inviteStore).open).toBe(false);
  });

  it('steps aside when a peer dials in', () => {
    const { commit, peek } = setup();
    commit(inviteOpenedTopic());

    commit(
      contactSeenTopic({
        endpointId: 'ep-1',
        direction: 'inbound',
        seenAt: 1,
      }),
    );

    // The dialog is modal, so a request arriving behind it would sit under
    // the overlay unseen.
    expect(peek(inviteStore).open).toBe(false);
  });

  it('stays put when this device dials out', () => {
    const { commit, peek } = setup();
    commit(inviteOpenedTopic());

    commit(
      contactSeenTopic({
        endpointId: 'ep-1',
        direction: 'outbound',
        seenAt: 1,
      }),
    );

    // Our own dial is us going somewhere, not someone arriving.
    expect(peek(inviteStore).open).toBe(true);
  });
});
