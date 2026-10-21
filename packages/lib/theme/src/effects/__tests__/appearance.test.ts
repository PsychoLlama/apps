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

// A page with the theme-color meta tags, and the action bound to it.
// Disposing it restores a blank `<html>` and storage.
const setup = async () => {
  const light = mountMetaTag(THEME_COLOR_META_ID.light);
  const dark = mountMetaTag(THEME_COLOR_META_ID.dark);
  const effects = createTestController();

  return {
    appearance: await effects.run($appearance),
    setAppearance: await effects.run($setAppearance),
    metaColors: () => ({
      light: light.getAttribute('content'),
      dark: dark.getAttribute('content'),
    }),

    async [Symbol.asyncDispose]() {
      await effects[Symbol.asyncDispose]();
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
    await using page = await setup();

    page.setAppearance('theme', 'teal');

    expect(document.documentElement.dataset[THEME_ATTRIBUTE]).toBe('teal');
    expect(page.appearance.theme).toBe('teal');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('teal');
  });

  it('handles each preference by its own attribute and key', async () => {
    await using page = await setup();

    page.setAppearance('colorScheme', 'dark');
    page.setAppearance('motion', 'reduce');

    expect(document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE]).toBe(
      'dark',
    );
    expect(document.documentElement.dataset[MOTION_ATTRIBUTE]).toBe('reduce');
    expect(page.appearance).toMatchObject({
      colorScheme: 'dark',
      motion: 'reduce',
    });
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('reduce');
  });

  it("drops the attribute and the stored value for 'system'", async () => {
    await using page = await setup();
    page.setAppearance('motion', 'reduce');

    page.setAppearance('motion', 'system');

    expect(document.documentElement.dataset[MOTION_ATTRIBUTE]).toBeUndefined();
    expect(page.appearance.motion).toBe('system');
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
  });

  it('stamps the default theme but forgets the stored one', async () => {
    await using page = await setup();
    page.setAppearance('theme', 'jade');

    page.setAppearance('theme', DEFAULT_THEME_ID);

    expect(document.documentElement.dataset[THEME_ATTRIBUTE]).toBe(
      DEFAULT_THEME_ID,
    );
    expect(page.appearance.theme).toBe(DEFAULT_THEME_ID);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("syncs the theme-color meta tags to the theme's colors", async () => {
    await using page = await setup();

    page.setAppearance('theme', 'jade');

    expect(page.metaColors()).toEqual(THEME_COLORS.jade);
  });

  it('collapses the theme-color meta tags onto a forced scheme', async () => {
    await using page = await setup();
    page.setAppearance('theme', 'jade');

    page.setAppearance('colorScheme', 'dark');
    expect(page.metaColors()).toEqual({
      light: THEME_COLORS.jade.dark,
      dark: THEME_COLORS.jade.dark,
    });

    page.setAppearance('colorScheme', 'light');
    expect(page.metaColors()).toEqual({
      light: THEME_COLORS.jade.light,
      dark: THEME_COLORS.jade.light,
    });

    page.setAppearance('colorScheme', 'system');
    expect(page.metaColors()).toEqual(THEME_COLORS.jade);
  });

  it('switches before a storage failure throws', async () => {
    await using page = await setup();
    const error = new DOMException('blocked', 'SecurityError');
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw error;
      });

    expect(() => page.setAppearance('theme', 'pink')).toThrow(error);
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'pink');
    expect(document.documentElement.dataset[THEME_ATTRIBUTE]).toBe('pink');
    expect(page.appearance.theme).toBe('pink');
  });
});
