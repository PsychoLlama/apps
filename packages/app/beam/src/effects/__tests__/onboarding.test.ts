import { createTestController } from '@lib/effects/testing';
import {
  readOnboarding,
  saveContact,
  saveOnboarding,
} from '../../platform/database';
import {
  $identityResolved,
  $onboarding,
  $onboardingRestored,
} from '../../state';
import {
  $finishNaming,
  $finishPairing,
  $restoreOnboarding,
} from '../onboarding';
import { SELF_ID } from './fixtures';

vi.mock('../../platform/database');

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(5_000);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('$restoreOnboarding', () => {
  it('lands the persisted step', async () => {
    vi.mocked(readOnboarding).mockResolvedValue({
      step: 'pairing',
      updatedAt: 1,
    });
    await using effects = createTestController();

    await effects.run($restoreOnboarding);
    const progress = await effects.run($onboarding);

    expect(progress).toEqual({ step: 'pairing', updatedAt: 1 });
  });

  it('reads nothing stored as a device nobody has set up', async () => {
    vi.mocked(readOnboarding).mockResolvedValue(null);
    await using effects = createTestController();

    await effects.run($restoreOnboarding);
    const progress = await effects.run($onboarding);

    expect(progress).toEqual({ step: 'naming', updatedAt: null });
  });

  it('fails when the disk does', async () => {
    const error = new Error('Testing failures');
    vi.mocked(readOnboarding).mockRejectedValue(error);
    await using effects = createTestController();

    await expect(effects.run($restoreOnboarding)).rejects.toMatchObject({
      errors: [error],
    });
  });
});

describe('$finishNaming', () => {
  it('names the device, then moves on to pairing', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const finishNaming = await effects.run($finishNaming);
    const progress = await effects.run($onboarding);
    identityResolved(SELF_ID);

    await finishNaming('Laptop');

    expect(saveContact).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'self', label: 'Laptop' }),
    );
    expect(progress.step).toBe('pairing');
    expect(saveOnboarding).toHaveBeenCalledWith({
      step: 'pairing',
      updatedAt: 5_000,
    });
  });

  it('refuses a blank name', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const finishNaming = await effects.run($finishNaming);
    const progress = await effects.run($onboarding);
    identityResolved(SELF_ID);

    await finishNaming('   ');

    expect(saveContact).not.toHaveBeenCalled();
    expect(progress.step).toBe('naming');
  });

  it('stays put when the device can’t be named yet', async () => {
    await using effects = createTestController();
    const finishNaming = await effects.run($finishNaming);
    const progress = await effects.run($onboarding);

    await finishNaming('Laptop');

    expect(progress.step).toBe('naming');
    expect(saveOnboarding).not.toHaveBeenCalled();
  });

  it('ignores a stale submit from a step already finished', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const onboardingRestored = await effects.run($onboardingRestored);
    const finishNaming = await effects.run($finishNaming);
    const progress = await effects.run($onboarding);
    identityResolved(SELF_ID);
    onboardingRestored({ step: 'done', updatedAt: 1 });

    await finishNaming('Laptop');

    expect(saveContact).not.toHaveBeenCalled();
    expect(progress.step).toBe('done');
  });
});

describe('$finishPairing', () => {
  it('finishes setup from the pairing step', async () => {
    await using effects = createTestController();
    const onboardingRestored = await effects.run($onboardingRestored);
    const finishPairing = await effects.run($finishPairing);
    const progress = await effects.run($onboarding);
    onboardingRestored({ step: 'pairing', updatedAt: 1 });

    await finishPairing();

    expect(progress).toEqual({ step: 'done', updatedAt: 5_000 });
    expect(saveOnboarding).toHaveBeenCalledWith({
      step: 'done',
      updatedAt: 5_000,
    });
  });

  it('is a no-op on any other step', async () => {
    await using effects = createTestController();
    const finishPairing = await effects.run($finishPairing);
    const progress = await effects.run($onboarding);

    await finishPairing();

    expect(progress.step).toBe('naming');
    expect(saveOnboarding).not.toHaveBeenCalled();
  });

  it('fails when the write does', async () => {
    const error = new Error('Testing failures');
    vi.mocked(saveOnboarding).mockRejectedValue(error);
    await using effects = createTestController();
    const onboardingRestored = await effects.run($onboardingRestored);
    const finishPairing = await effects.run($finishPairing);
    onboardingRestored({ step: 'pairing', updatedAt: 1 });

    await expect(finishPairing()).rejects.toBe(error);
  });
});
