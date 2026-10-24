import { createTestController } from '@lib/effects/testing';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants';
import { $appearance, $appearanceChanged } from '../appearance';

// What another tab's write looks like from here.
const storageEvent = (init: StorageEventInit) =>
  dispatchEvent(
    new StorageEvent('storage', { storageArea: localStorage, ...init }),
  );

beforeEach(() => {
  localStorage.clear();
});

describe('$appearance', () => {
  it('hydrates the stored scheme', async () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    await using effects = createTestController();

    const appearance = await effects.run($appearance);

    expect(appearance()).toBe('dark');
  });

  it('reads system when nothing is stored', async () => {
    await using effects = createTestController();

    const appearance = await effects.run($appearance);

    expect(appearance()).toBe('system');
  });

  it('reads system when the stored value is unrecognized', async () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'sepia');
    await using effects = createTestController();

    const appearance = await effects.run($appearance);

    expect(appearance()).toBe('system');
  });

  it('follows writes from other tabs', async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);

    storageEvent({ key: COLOR_SCHEME_STORAGE_KEY, newValue: 'dark' });
    expect(appearance()).toBe('dark');

    storageEvent({ key: COLOR_SCHEME_STORAGE_KEY, newValue: null });
    expect(appearance()).toBe('system');
  });

  it('reads system when storage is cleared', async () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    await using effects = createTestController();
    const appearance = await effects.run($appearance);

    storageEvent({ key: null });

    expect(appearance()).toBe('system');
  });

  it('ignores other keys and storage areas', async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);

    storageEvent({ key: 'other', newValue: 'dark' });
    storageEvent({
      key: COLOR_SCHEME_STORAGE_KEY,
      newValue: 'dark',
      storageArea: sessionStorage,
    });

    expect(appearance()).toBe('system');
  });

  it('stops following when released', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');

    {
      await using effects = createTestController();
      await effects.run($appearance);
      expect(remove).not.toHaveBeenCalledWith('storage', expect.anything());
    }

    expect(remove).toHaveBeenCalledWith('storage', expect.any(Function));
    remove.mockRestore();
  });
});

describe('$appearanceChanged', () => {
  it('sets the appearance', async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const appearanceChanged = await effects.run($appearanceChanged);

    appearanceChanged('dark');

    expect(appearance()).toBe('dark');
  });
});
