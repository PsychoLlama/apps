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

  it('reads system when storage is cleared', async () => {
    localStorage.setItem(MOTION_STORAGE_KEY, 'reduce');
    await using effects = createTestController();
    const motion = await effects.run($motion);

    storageEvent({ key: null });

    expect(motion()).toBe('system');
  });

  it('ignores other keys and storage areas', async () => {
    await using effects = createTestController();
    const motion = await effects.run($motion);

    storageEvent({ key: 'other', newValue: 'reduce' });
    storageEvent({
      key: MOTION_STORAGE_KEY,
      newValue: 'reduce',
      storageArea: sessionStorage,
    });

    expect(motion()).toBe('system');
  });

  it('stops following when released', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');

    {
      await using effects = createTestController();
      await effects.run($motion);
      expect(remove).not.toHaveBeenCalledWith('storage', expect.anything());
    }

    expect(remove).toHaveBeenCalledWith('storage', expect.any(Function));
    remove.mockRestore();
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
