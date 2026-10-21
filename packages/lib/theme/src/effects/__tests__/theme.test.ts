import { createTestController } from '@lib/effects/testing';
import {
  DEFAULT_THEME_ID,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
} from '../../constants';
import { $resetTheme, $selectTheme, $theme } from '../theme';

// MutationObserver records arrive in a microtask.
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

beforeEach(() => {
  delete document.documentElement.dataset[THEME_ATTRIBUTE];
  localStorage.clear();
});

describe('$theme', () => {
  it('starts from the attribute the prelude stamped', async () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';
    await using effects = createTestController();

    const theme = await effects.run($theme);

    expect(theme()).toBe('jade');
  });

  it('reads the default when the attribute is missing', async () => {
    await using effects = createTestController();

    const theme = await effects.run($theme);

    expect(theme()).toBe(DEFAULT_THEME_ID);
  });

  it('follows later changes to the attribute', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);

    document.documentElement.dataset[THEME_ATTRIBUTE] = 'plum';
    await flush();

    expect(theme()).toBe('plum');
  });

  it('stops following once released', async () => {
    const effects = createTestController();
    const theme = await effects.run($theme);
    await effects[Symbol.asyncDispose]();

    document.documentElement.dataset[THEME_ATTRIBUTE] = 'plum';
    await flush();

    expect(theme()).toBe(DEFAULT_THEME_ID);
  });
});

describe('$selectTheme', () => {
  it('writes the theme through, echoing into $theme', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);
    const selectTheme = await effects.run($selectTheme);

    selectTheme('teal');
    await flush();

    expect(theme()).toBe('teal');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('teal');
  });
});

describe('$resetTheme', () => {
  it('forgets the preference, echoing the default into $theme', async () => {
    await using effects = createTestController();
    const theme = await effects.run($theme);
    const selectTheme = await effects.run($selectTheme);
    const resetTheme = await effects.run($resetTheme);
    selectTheme('teal');

    resetTheme();
    await flush();

    expect(theme()).toBe(DEFAULT_THEME_ID);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});
