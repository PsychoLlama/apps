import { createTestController } from '@lib/effects/testing';
import { COLOR_SCHEME_STORAGE_KEY } from '../../constants';
import {
  $appearance,
  $appearanceChanged,
  $setAppearance,
  $systemColorScheme,
} from '../appearance';

// What another tab's write looks like from here.
const storageEvent = (init: StorageEventInit) =>
  dispatchEvent(
    new StorageEvent('storage', { storageArea: localStorage, ...init }),
  );

// jsdom has no `matchMedia`. Stub one backed by a real `EventTarget`
// whose OS preference tests can flip.
const stubMatchMedia = (initial: 'light' | 'dark') => {
  const media = Object.assign(new EventTarget(), {
    matches: initial === 'dark',
  });

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      expect(query).toBe('(prefers-color-scheme: dark)');
      return media;
    }),
  );

  return {
    media,
    prefer: (scheme: 'light' | 'dark') => {
      media.matches = scheme === 'dark';
      media.dispatchEvent(
        Object.assign(new Event('change'), { matches: media.matches }),
      );
    },
  };
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
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
  it('writes the cell and storage', async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);

    setAppearance('dark');

    expect(appearance()).toBe('dark');
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
  });

  it("clears the stored value for 'system'", async () => {
    await using effects = createTestController();
    const appearance = await effects.run($appearance);
    const setAppearance = await effects.run($setAppearance);
    setAppearance('dark');

    setAppearance('system');

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
    expect(appearance()).toBe('dark');
  });
});

describe('$systemColorScheme', () => {
  it('starts from the OS preference', async () => {
    stubMatchMedia('dark');
    await using effects = createTestController();

    const scheme = await effects.run($systemColorScheme);

    expect(scheme()).toBe('dark');
  });

  it('follows changes to the OS preference', async () => {
    const { prefer } = stubMatchMedia('light');
    await using effects = createTestController();
    const scheme = await effects.run($systemColorScheme);

    prefer('dark');
    expect(scheme()).toBe('dark');

    prefer('light');
    expect(scheme()).toBe('light');
  });

  it('stops listening when released', async () => {
    const { media } = stubMatchMedia('light');
    const add = vi.spyOn(media, 'addEventListener');
    const remove = vi.spyOn(media, 'removeEventListener');

    {
      await using effects = createTestController();
      await effects.run($systemColorScheme);
      expect(remove).not.toHaveBeenCalled();
    }

    expect(remove).toHaveBeenCalledWith('change', add.mock.calls[0]?.[1]);
  });
});
