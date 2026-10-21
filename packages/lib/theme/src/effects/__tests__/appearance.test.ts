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
import { $appearance } from '../../state/appearance';
import { $setAppearance } from '../appearance';

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

describe('$setAppearance', () => {
  it('writes the attribute, the store, and storage', async () => {
    using page = setup();
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);

    setAppearance('theme', 'teal');

    expect(page.dataset[THEME_ATTRIBUTE]).toBe('teal');
    expect(appearance.theme).toBe('teal');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('teal');
  });

  it('handles each preference by its own attribute and key', async () => {
    using page = setup();
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);

    setAppearance('colorScheme', 'dark');
    setAppearance('motion', 'reduce');

    expect(page.dataset[COLOR_SCHEME_ATTRIBUTE]).toBe('dark');
    expect(page.dataset[MOTION_ATTRIBUTE]).toBe('reduce');
    expect(appearance).toMatchObject({
      colorScheme: 'dark',
      motion: 'reduce',
    });
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('reduce');
  });

  it("drops the attribute and the stored value for 'system'", async () => {
    using page = setup();
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);
    setAppearance('motion', 'reduce');

    setAppearance('motion', 'system');

    expect(page.dataset[MOTION_ATTRIBUTE]).toBeUndefined();
    expect(appearance.motion).toBe('system');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
  });

  it('stamps the default theme but forgets the stored one', async () => {
    using page = setup();
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);
    setAppearance('theme', 'jade');

    setAppearance('theme', DEFAULT_THEME_ID);

    expect(page.dataset[THEME_ATTRIBUTE]).toBe(DEFAULT_THEME_ID);
    expect(appearance.theme).toBe(DEFAULT_THEME_ID);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("syncs the theme-color meta tags to the theme's colors", async () => {
    using page = setup();
    await using effects = createTestController();
    const setAppearance = await effects.run($setAppearance);

    setAppearance('theme', 'jade');

    expect(page.metaColors()).toEqual(THEME_COLORS.jade);
  });

  it('collapses the theme-color meta tags onto a forced scheme', async () => {
    using page = setup();
    await using effects = createTestController();
    const setAppearance = await effects.run($setAppearance);
    setAppearance('theme', 'jade');

    setAppearance('colorScheme', 'dark');
    expect(page.metaColors()).toEqual({
      light: THEME_COLORS.jade.dark,
      dark: THEME_COLORS.jade.dark,
    });

    setAppearance('colorScheme', 'light');
    expect(page.metaColors()).toEqual({
      light: THEME_COLORS.jade.light,
      dark: THEME_COLORS.jade.light,
    });

    setAppearance('colorScheme', 'system');
    expect(page.metaColors()).toEqual(THEME_COLORS.jade);
  });

  it('switches before a storage failure throws', async () => {
    using page = setup();
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);
    const error = new DOMException('blocked', 'SecurityError');
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw error;
      });

    expect(() => setAppearance('theme', 'pink')).toThrow(error);
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'pink');
    expect(page.dataset[THEME_ATTRIBUTE]).toBe('pink');
    expect(appearance.theme).toBe('pink');
  });
});
