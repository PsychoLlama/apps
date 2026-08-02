/**
 * Unit tests for how far setting this device up has got. Folds only — the
 * facts go in, the step comes out.
 */

import { createTestRuntime } from '@lib/state';
import {
  onboardingAdvancedTopic,
  onboardingLoadFailedTopic,
  onboardingLoadingTopic,
  onboardingRestoredTopic,
  onboardingStore,
} from '../progress';
import { beamScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('onboardingStore', () => {
  it('knows nothing about this device before the disk answers', () => {
    const { peek } = setup();

    // The step reads `naming` from the start, but the status is what makes it
    // mean anything — the surface renders nothing at all until it moves.
    expect(peek(onboardingStore).status).toBe('initial');
    expect(peek(onboardingStore).step).toBe('naming');
    expect(peek(onboardingStore).updatedAt).toBeNull();
  });

  it('marks the read as under way', () => {
    const { commit, peek } = setup();

    commit(onboardingLoadingTopic());

    expect(peek(onboardingStore).status).toBe('loading');
  });
});

describe('onboardingRestoredTopic', () => {
  it('takes back the step and when it was reached', () => {
    const { commit, peek } = setup();

    commit(onboardingRestoredTopic({ step: 'pairing', updatedAt: 1234 }));

    expect(peek(onboardingStore).status).toBe('ready');
    expect(peek(onboardingStore).step).toBe('pairing');
    expect(peek(onboardingStore).updatedAt).toBe(1234);
  });

  it('reads an empty table as a device nobody has started', () => {
    const { commit, peek } = setup();

    commit(onboardingRestoredTopic(null));

    expect(peek(onboardingStore).status).toBe('ready');
    expect(peek(onboardingStore).step).toBe('naming');
    expect(peek(onboardingStore).updatedAt).toBeNull();
  });
});

describe('onboardingLoadFailedTopic', () => {
  it('keeps unreadable progress apart from no progress', () => {
    const { commit, peek } = setup();

    commit(onboardingLoadFailedTopic());

    expect(peek(onboardingStore).status).toBe('failed');
  });
});

describe('onboardingAdvancedTopic', () => {
  it('moves the step and stamps when it happened', () => {
    const { commit, peek } = setup();
    commit(onboardingRestoredTopic(null));

    commit(onboardingAdvancedTopic({ step: 'pairing', updatedAt: 1234 }));

    expect(peek(onboardingStore).step).toBe('pairing');
    expect(peek(onboardingStore).updatedAt).toBe(1234);
  });

  it('settles a device whose disk would not open', () => {
    const { commit, peek } = setup();
    commit(onboardingLoadFailedTopic());

    commit(onboardingAdvancedTopic({ step: 'done', updatedAt: 1234 }));

    // A step the reader just finished is the truth about this device however
    // unreachable the disk was a moment ago.
    expect(peek(onboardingStore).status).toBe('ready');
    expect(peek(onboardingStore).step).toBe('done');
  });
});
