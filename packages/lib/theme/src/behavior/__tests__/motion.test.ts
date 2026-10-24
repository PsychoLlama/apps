import { createTestController } from '@lib/effects/testing';
import { MOTION_STORAGE_KEY } from '../../constants';
import { $motion, $motionChanged } from '../motion';

// What another tab's write looks like from here.
const storageEvent = (init: StorageEventInit) =>
  dispatchEvent(
    new StorageEvent('storage', { storageArea: localStorage, ...init }),
  );

beforeEach(() => {
  localStorage.clear();
});

describe('$motion', () => {
  it('hydrates the stored preference', async () => {
    localStorage.setItem(MOTION_STORAGE_KEY, 'reduce');
    await using effects = createTestController();

    const motion = await effects.run($motion);

    expect(motion()).toBe('reduce');
  });

  it('reads system when nothing is stored', async () => {
    await using effects = createTestController();

    const motion = await effects.run($motion);

    expect(motion()).toBe('system');
  });

  it('reads system when the stored value is unrecognized', async () => {
    localStorage.setItem(MOTION_STORAGE_KEY, 'jerky');
    await using effects = createTestController();

    const motion = await effects.run($motion);

    expect(motion()).toBe('system');
  });

  it('follows writes from other tabs', async () => {
    await using effects = createTestController();
    const motion = await effects.run($motion);

    storageEvent({ key: MOTION_STORAGE_KEY, newValue: 'reduce' });
    expect(motion()).toBe('reduce');

    storageEvent({ key: MOTION_STORAGE_KEY, newValue: null });
    expect(motion()).toBe('system');
  });
});

describe('$motionChanged', () => {
  it('sets the motion preference', async () => {
    await using effects = createTestController();
    const motion = await effects.run($motion);
    const motionChanged = await effects.run($motionChanged);

    motionChanged('reduce');

    expect(motion()).toBe('reduce');
  });
});
