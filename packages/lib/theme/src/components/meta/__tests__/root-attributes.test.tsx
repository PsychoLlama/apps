import { render } from '@solidjs/testing-library';
import { EffectsRoot } from '@lib/effects/solid';
import {
  createTestController,
  type TestController,
} from '@lib/effects/testing';
import { $setAppearance } from '../../../behavior/appearance';
import { $setMotion } from '../../../behavior/motion';
import { $setTheme } from '../../../behavior/theme';
import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  MOTION_ATTRIBUTE,
  MOTION_STORAGE_KEY,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
} from '../../../constants';
import { RootAttributes } from '../root-attributes';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// What another tab's write looks like from here.
const storageEvent = (init: StorageEventInit) =>
  dispatchEvent(
    new StorageEvent('storage', { storageArea: localStorage, ...init }),
  );

// Mount under the controller and let the resources resolve.
const renderRoot = async (effects: TestController) => {
  const tree = render(() => (
    <EffectsRoot controller={effects.controller}>
      <RootAttributes />
    </EffectsRoot>
  ));
  await settle();

  return tree;
};

const { dataset } = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  delete dataset[THEME_ATTRIBUTE];
  delete dataset[COLOR_SCHEME_ATTRIBUTE];
  delete dataset[MOTION_ATTRIBUTE];
});

describe('RootAttributes', () => {
  it('stamps the stored preferences once mounted', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'jade');
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    localStorage.setItem(MOTION_STORAGE_KEY, 'reduce');
    await using effects = createTestController();
    const { unmount } = await renderRoot(effects);

    expect(dataset[THEME_ATTRIBUTE]).toBe('jade');
    expect(dataset[COLOR_SCHEME_ATTRIBUTE]).toBe('dark');
    expect(dataset[MOTION_ATTRIBUTE]).toBe('reduce');
    unmount();
  });

  it('follows changes made here', async () => {
    await using effects = createTestController();
    const { unmount } = await renderRoot(effects);
    const setTheme = await effects.run($setTheme);
    const setAppearance = await effects.run($setAppearance);
    const setMotion = await effects.run($setMotion);

    setTheme('jade');
    setAppearance('dark');
    setMotion('reduce');

    expect(dataset[THEME_ATTRIBUTE]).toBe('jade');
    expect(dataset[COLOR_SCHEME_ATTRIBUTE]).toBe('dark');
    expect(dataset[MOTION_ATTRIBUTE]).toBe('reduce');
    unmount();
  });

  it('follows changes from other tabs', async () => {
    await using effects = createTestController();
    const { unmount } = await renderRoot(effects);

    storageEvent({ key: THEME_STORAGE_KEY, newValue: 'jade' });
    storageEvent({ key: COLOR_SCHEME_STORAGE_KEY, newValue: 'dark' });
    storageEvent({ key: MOTION_STORAGE_KEY, newValue: 'reduce' });

    expect(dataset[THEME_ATTRIBUTE]).toBe('jade');
    expect(dataset[COLOR_SCHEME_ATTRIBUTE]).toBe('dark');
    expect(dataset[MOTION_ATTRIBUTE]).toBe('reduce');
    unmount();
  });

  it("drops the overrides for 'system'", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'jade');
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    localStorage.setItem(MOTION_STORAGE_KEY, 'reduce');
    await using effects = createTestController();
    const { unmount } = await renderRoot(effects);

    // A cleared store reads as each preference's fallback.
    storageEvent({ key: null });

    expect(dataset[THEME_ATTRIBUTE]).toBe(DEFAULT_THEME_ID);
    expect(dataset[COLOR_SCHEME_ATTRIBUTE]).toBeUndefined();
    expect(dataset[MOTION_ATTRIBUTE]).toBeUndefined();
    unmount();
  });
});
