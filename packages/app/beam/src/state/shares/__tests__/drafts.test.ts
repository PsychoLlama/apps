/**
 * Unit tests for the per-peer composer drafts. They live in the scope rather
 * than the textarea, so what matters is that they survive the right things
 * and don't outlive the peer they were addressed to.
 */

import { createTestRuntime } from '@lib/state';
import { draftChangedTopic, draftClearedTopic, draftsStore } from '../drafts';
import { contactForgottenTopic } from '../../contacts';
import { beamScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('drafts', () => {
  it('holds what the reader has typed, per peer', () => {
    const { commit, peek } = setup();

    commit(draftChangedTopic({ endpointId: 'ep-1', body: 'half a th' }));

    expect(peek(draftsStore).bodies).toEqual({ 'ep-1': 'half a th' });
  });

  it('lets a draft go once it has been sent', () => {
    const { commit, peek } = setup();
    commit(draftChangedTopic({ endpointId: 'ep-1', body: 'sent' }));

    commit(draftClearedTopic('ep-1'));

    expect(peek(draftsStore).bodies).toEqual({});
  });

  it('lets a forgotten contact take its draft with it', () => {
    const { commit, peek } = setup();
    commit(draftChangedTopic({ endpointId: 'ep-1', body: 'unsent' }));

    commit(contactForgottenTopic('ep-1'));

    expect(peek(draftsStore).bodies).toEqual({});
  });
});
