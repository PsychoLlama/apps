import { createTestController } from '@lib/effects/testing';
import { $systemColorScheme } from '../system-color-scheme';

// jsdom has no `matchMedia`. Stub one backed by a real `EventTarget`
// whose OS preference tests can flip.
const setup = (initial: 'light' | 'dark') => {
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('$systemColorScheme', () => {
  it('starts from the OS preference', async () => {
    setup('dark');
    await using effects = createTestController();

    const scheme = await effects.run($systemColorScheme);

    expect(scheme()).toBe('dark');
  });

  it('follows changes to the OS preference', async () => {
    const { prefer } = setup('light');
    await using effects = createTestController();
    const scheme = await effects.run($systemColorScheme);

    prefer('dark');
    expect(scheme()).toBe('dark');

    prefer('light');
    expect(scheme()).toBe('light');
  });

  it('stops listening when released', async () => {
    const { media } = setup('light');
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
