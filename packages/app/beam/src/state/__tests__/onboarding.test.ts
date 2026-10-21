/** Unit tests for setup progress and the setup form's draft. */

import { createTestController } from '@lib/effects/testing';
import {
  $onboarding,
  $onboardingAdvanced,
  $onboardingRestored,
  $setupDraft,
  $setupNameChanged,
} from '../onboarding';

describe('$onboarding', () => {
  it('starts at the first step, never finished', async () => {
    await using effects = createTestController();
    const progress = await effects.run($onboarding);

    expect(progress).toMatchObject({ step: 'naming', updatedAt: null });
  });
});

describe('$onboardingRestored', () => {
  it('picks up where the device left off', async () => {
    await using effects = createTestController();
    const progress = await effects.run($onboarding);
    const onboardingRestored = await effects.run($onboardingRestored);

    onboardingRestored({ step: 'pairing', updatedAt: 5 });

    expect(progress).toMatchObject({ step: 'pairing', updatedAt: 5 });
  });

  it('reads nothing stored as a device nobody has set up', async () => {
    await using effects = createTestController();
    const progress = await effects.run($onboarding);
    const onboardingRestored = await effects.run($onboardingRestored);

    onboardingRestored(null);

    expect(progress).toMatchObject({ step: 'naming', updatedAt: null });
  });
});

describe('$onboardingAdvanced', () => {
  it('moves to the step and records when', async () => {
    await using effects = createTestController();
    const progress = await effects.run($onboarding);
    const onboardingAdvanced = await effects.run($onboardingAdvanced);

    onboardingAdvanced({ step: 'done', updatedAt: 9 });

    expect(progress).toMatchObject({ step: 'done', updatedAt: 9 });
  });
});

describe('$setupNameChanged', () => {
  it('holds the name exactly as typed', async () => {
    await using effects = createTestController();
    const draft = await effects.run($setupDraft);
    const setupNameChanged = await effects.run($setupNameChanged);

    setupNameChanged('  Carol’s ');

    expect(draft.name).toBe('  Carol’s ');
  });
});
