import { createTestController } from '@lib/effects/testing';
import { DEFAULT_THEME_ID, THEME_STORAGE_KEY } from '../../constants';
import { $setTheme, $theme, $themeChanged } from '../theme';

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

describe('$setTheme', () => {
  it('writes the cell and storage', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);
    const setTheme = await effects.run($setTheme);

    setTheme('jade');

    expect(theme()).toBe('jade');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('jade');
  });

  it('clears the stored value for the default theme', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);
    const setTheme = await effects.run($setTheme);
    setTheme('jade');

    setTheme(DEFAULT_THEME_ID);

    expect(theme()).toBe(DEFAULT_THEME_ID);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('switches when storage refuses access', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);
    const setTheme = await effects.run($setTheme);
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    setTheme('jade');

    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'jade');
    expect(theme()).toBe('jade');
  });

  it('switches before a storage failure throws', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);
    const setTheme = await effects.run($setTheme);
    const error = new Error('Broken.');
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw error;
      });

    expect(() => setTheme('jade')).toThrow(error);
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'jade');
    expect(theme()).toBe('jade');
  });
});
