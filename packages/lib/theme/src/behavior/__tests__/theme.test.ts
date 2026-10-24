import { createTestController } from '@lib/effects/testing';
import { DEFAULT_THEME_ID, THEME_STORAGE_KEY } from '../../constants';
import { $theme, $themeChanged } from '../theme';

// What another tab's write looks like from here.
const storageEvent = (init: StorageEventInit) =>
  dispatchEvent(
    new StorageEvent('storage', { storageArea: localStorage, ...init }),
  );

beforeEach(() => {
  localStorage.clear();
});

describe('$theme', () => {
  it('hydrates the stored theme', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'jade');
    await using effects = createTestController();

    const theme = await effects.run($theme);

    expect(theme()).toBe('jade');
  });

  it('reads the default when nothing is stored', async () => {
    await using effects = createTestController();

    const theme = await effects.run($theme);

    expect(theme()).toBe(DEFAULT_THEME_ID);
  });

  it('reads the default when the stored value is unrecognized', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'not-a-theme');
    await using effects = createTestController();

    const theme = await effects.run($theme);

    expect(theme()).toBe(DEFAULT_THEME_ID);
  });

  it('follows writes from other tabs', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);

    storageEvent({ key: THEME_STORAGE_KEY, newValue: 'jade' });
    expect(theme()).toBe('jade');

    storageEvent({ key: THEME_STORAGE_KEY, newValue: null });
    expect(theme()).toBe(DEFAULT_THEME_ID);
  });

  it('reads the default when storage is cleared', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'jade');
    await using effects = createTestController();
    const theme = await effects.run($theme);

    storageEvent({ key: null });

    expect(theme()).toBe(DEFAULT_THEME_ID);
  });

  it('ignores other keys and storage areas', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);

    storageEvent({ key: 'other', newValue: 'jade' });
    storageEvent({
      key: THEME_STORAGE_KEY,
      newValue: 'jade',
      storageArea: sessionStorage,
    });

    expect(theme()).toBe(DEFAULT_THEME_ID);
  });

  it('stops following when released', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');

    {
      await using effects = createTestController();
      await effects.run($theme);
      expect(remove).not.toHaveBeenCalledWith('storage', expect.anything());
    }

    expect(remove).toHaveBeenCalledWith('storage', expect.any(Function));
    remove.mockRestore();
  });
});

describe('$themeChanged', () => {
  it('sets the theme', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);
    const themeChanged = await effects.run($themeChanged);

    themeChanged('jade');

    expect(theme()).toBe('jade');
  });
});
