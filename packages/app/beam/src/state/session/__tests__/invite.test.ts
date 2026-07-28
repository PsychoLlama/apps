/**
 * Unit tests for the invite dialog's visibility. Trivial on its own, but the
 * flag lives in the scope rather than the component, so it's worth pinning
 * that a dismissal actually lands rather than being swallowed.
 */

import { createTestRuntime } from '@lib/state-next';
import { inviteClosedTopic, inviteOpenedTopic, inviteStore } from '../invite';
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
});
