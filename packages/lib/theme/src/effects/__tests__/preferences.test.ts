import { createTestController } from '@lib/effects/testing';
import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  MOTION_ATTRIBUTE,
  MOTION_STORAGE_KEY,
  THEME_ATTRIBUTE,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  THEME_STORAGE_KEY,
} from '../../constants';
import { $preferences } from '../../state/preferences';
import { $setPreferences } from '../preferences';

const mountMetaTag = (id: string): HTMLMetaElement => {
  const meta = document.createElement('meta');
  meta.id = id;
  document.head.appendChild(meta);
  return meta;
};

// The theme-color meta tags on a blank `<html>`. Disposing it restores
// the page and storage.
const setup = () => {
  const light = mountMetaTag(THEME_COLOR_META_ID.light);
  const dark = mountMetaTag(THEME_COLOR_META_ID.dark);

  return {
    dataset: document.documentElement.dataset,
    metaColors: () => ({
      light: light.getAttribute('content'),
      dark: dark.getAttribute('content'),
    }),

    [Symbol.dispose]() {
      light.remove();
      dark.remove();
      delete document.documentElement.dataset[THEME_ATTRIBUTE];
      delete document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
      delete document.documentElement.dataset[MOTION_ATTRIBUTE];
      localStorage.clear();
    },
  };
};

describe('$setPreferences', () => {
  it('writes the attribute, the store, and storage', async () => {
    using page = setup();
    await using effects = createTestController();
    const preferences = await effects.run($preferences);
    const setPreferences = await effects.run($setPreferences);

    setPreferences('theme', 'teal');

    expect(page.dataset[THEME_ATTRIBUTE]).toBe('teal');
    expect(preferences.theme).toBe('teal');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('teal');
  });

  it('handles each preference by its own attribute and key', async () => {
    using page = setup();
    await using effects = createTestController();
    const preferences = await effects.run($preferences);
    const setPreferences = await effects.run($setPreferences);

    setPreferences('colorScheme', 'dark');
    setPreferences('motion', 'reduce');

    expect(page.dataset[COLOR_SCHEME_ATTRIBUTE]).toBe('dark');
    expect(page.dataset[MOTION_ATTRIBUTE]).toBe('reduce');
    expect(preferences).toMatchObject({
      colorScheme: 'dark',
      motion: 'reduce',
    });
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('reduce');
  });

  it("drops the attribute and the stored value for 'system'", async () => {
    using page = setup();
    await using effects = createTestController();
    const preferences = await effects.run($preferences);
    const setPreferences = await effects.run($setPreferences);
    setPreferences('motion', 'reduce');

    setPreferences('motion', 'system');

    expect(page.dataset[MOTION_ATTRIBUTE]).toBeUndefined();
    expect(preferences.motion).toBe('system');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
  });

  it('stamps the default theme but forgets the stored one', async () => {
    using page = setup();
    await using effects = createTestController();
    const preferences = await effects.run($preferences);
    const setPreferences = await effects.run($setPreferences);
    setPreferences('theme', 'jade');

    setPreferences('theme', DEFAULT_THEME_ID);

    expect(page.dataset[THEME_ATTRIBUTE]).toBe(DEFAULT_THEME_ID);
    expect(preferences.theme).toBe(DEFAULT_THEME_ID);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("syncs the theme-color meta tags to the theme's colors", async () => {
    using page = setup();
    await using effects = createTestController();
    const setPreferences = await effects.run($setPreferences);

    setPreferences('theme', 'jade');

    expect(page.metaColors()).toEqual(THEME_COLORS.jade);
  });

  it('collapses the theme-color meta tags onto a forced scheme', async () => {
    using page = setup();
    await using effects = createTestController();
    const setPreferences = await effects.run($setPreferences);
    setPreferences('theme', 'jade');

    setPreferences('colorScheme', 'dark');
    expect(page.metaColors()).toEqual({
      light: THEME_COLORS.jade.dark,
      dark: THEME_COLORS.jade.dark,
    });

    setPreferences('colorScheme', 'light');
    expect(page.metaColors()).toEqual({
      light: THEME_COLORS.jade.light,
      dark: THEME_COLORS.jade.light,
    });

    setPreferences('colorScheme', 'system');
    expect(page.metaColors()).toEqual(THEME_COLORS.jade);
  });

  it('switches before a storage failure throws', async () => {
    using page = setup();
    await using effects = createTestController();
    const preferences = await effects.run($preferences);
    const setPreferences = await effects.run($setPreferences);
    const error = new DOMException('blocked', 'SecurityError');
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw error;
      });

    expect(() => setPreferences('theme', 'pink')).toThrow(error);
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'pink');
    expect(page.dataset[THEME_ATTRIBUTE]).toBe('pink');
    expect(preferences.theme).toBe('pink');
  });
});
