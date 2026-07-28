/**
 * Unit tests for the removal confirmation's visibility. It's bound to an
 * endpoint rather than to a bare flag, which is what stops a question opened
 * over one contact from being answered against another.
 */

import { createTestRuntime } from '@lib/state-next';
import {
  removalClosedTopic,
  removalOpenedTopic,
  removalStore,
} from '../removal';
import { beamScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('removalStore', () => {
  it('starts shut', () => {
    const { peek } = setup();

    expect(peek(removalStore).endpointId).toBeNull();
  });

  it('opens over the contact it was asked for', () => {
    const { commit, peek } = setup();

    commit(removalOpenedTopic('ep-1'));

    expect(peek(removalStore).endpointId).toBe('ep-1');
  });

  it('closes on an answer', () => {
    const { commit, peek } = setup();
    commit(removalOpenedTopic('ep-1'));

    commit(removalClosedTopic());

    expect(peek(removalStore).endpointId).toBeNull();
  });

  it('re-aims at the contact most recently asked about', () => {
    const { commit, peek } = setup();
    commit(removalOpenedTopic('ep-1'));

    commit(removalOpenedTopic('ep-2'));

    expect(peek(removalStore).endpointId).toBe('ep-2');
  });
});
