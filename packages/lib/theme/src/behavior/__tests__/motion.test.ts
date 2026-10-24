import { createTestController } from '@lib/effects/testing';
import { MOTION_STORAGE_KEY } from '../../constants';
import { $motion, $motionChanged, $setMotion } from '../motion';

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

describe('$setMotion', () => {
  it('writes the cell and storage', async () => {
    await using effects = createTestController();
    const motion = await effects.run($motion);
    const setMotion = await effects.run($setMotion);

    setMotion('reduce');

    expect(motion()).toBe('reduce');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('reduce');
  });

  it("clears the stored value for 'system'", async () => {
    await using effects = createTestController();
    const motion = await effects.run($motion);
    const setMotion = await effects.run($setMotion);
    setMotion('reduce');

    setMotion('system');

    expect(motion()).toBe('system');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
  });

  it('switches when storage refuses access', async () => {
    await using effects = createTestController();
    const motion = await effects.run($motion);
    const setMotion = await effects.run($setMotion);
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    setMotion('reduce');

    expect(setItem).toHaveBeenCalledWith(MOTION_STORAGE_KEY, 'reduce');
    expect(motion()).toBe('reduce');
  });

  it('switches before a storage failure throws', async () => {
    await using effects = createTestController();
    const motion = await effects.run($motion);
    const setMotion = await effects.run($setMotion);
    const error = new Error('Broken.');
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw error;
      });

    expect(() => setMotion('reduce')).toThrow(error);
    expect(setItem).toHaveBeenCalledWith(MOTION_STORAGE_KEY, 'reduce');
    expect(motion()).toBe('reduce');
  });
});
