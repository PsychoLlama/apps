import { createTestController } from '@lib/effects/testing';
import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_STORAGE_KEY,
} from '../../constants';
import { $appearance, $appearanceChanged, $setAppearance } from '../appearance';

// What another tab's write looks like from here.
const storageEvent = (init: StorageEventInit) =>
  dispatchEvent(
    new StorageEvent('storage', { storageArea: localStorage, ...init }),
  );

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
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

describe('$setAppearance', () => {
  it('writes the attribute, the cell, and storage', async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);

    setAppearance('dark');

    expect(document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE]).toBe(
      'dark',
    );
    expect(appearance()).toBe('dark');
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
  });

  it("drops the attribute and the stored value for 'system'", async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);
    setAppearance('dark');

    setAppearance('system');

    expect(
      document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE],
    ).toBeUndefined();
    expect(appearance()).toBe('system');
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBeNull();
  });

  it('switches when storage refuses access', async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    setAppearance('dark');

    expect(setItem).toHaveBeenCalledWith(COLOR_SCHEME_STORAGE_KEY, 'dark');
    expect(document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE]).toBe(
      'dark',
    );
    expect(appearance()).toBe('dark');
  });

  it('switches before a storage failure throws', async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);
    const error = new Error('Broken.');
    using setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw error;
      });

    expect(() => setAppearance('dark')).toThrow(error);
    expect(setItem).toHaveBeenCalledWith(COLOR_SCHEME_STORAGE_KEY, 'dark');
    expect(document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE]).toBe(
      'dark',
    );
    expect(appearance()).toBe('dark');
  });
});
