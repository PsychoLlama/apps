import { createTestController } from '@lib/effects/testing';
import {
  COLOR_SCHEME_ATTRIBUTE,
  DEFAULT_THEME_ID,
  MOTION_ATTRIBUTE,
  THEME_ATTRIBUTE,
} from '../constants';
import { $hydrateAppearance } from '../dom';

beforeEach(() => {
  delete document.documentElement.dataset[THEME_ATTRIBUTE];
  delete document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
  delete document.documentElement.dataset[MOTION_ATTRIBUTE];
});

describe('$hydrateAppearance', () => {
  it('reads every preference stamped on <html>', async () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'dark';
    document.documentElement.dataset[MOTION_ATTRIBUTE] = 'reduce';

    await using effects = createTestController();

    expect(await effects.run($hydrateAppearance)).toEqual({
      theme: 'jade',
      colorScheme: 'dark',
      motion: 'reduce',
    });
  });

  it('falls back when the attributes are missing', async () => {
    await using effects = createTestController();

    expect(await effects.run($hydrateAppearance)).toEqual({
      theme: DEFAULT_THEME_ID,
      colorScheme: 'system',
      motion: 'system',
    });
  });

  it('falls back when the attributes are unrecognized', async () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'not-a-theme';
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'sepia';
    document.documentElement.dataset[MOTION_ATTRIBUTE] = 'jerky';

    await using effects = createTestController();

    expect(await effects.run($hydrateAppearance)).toEqual({
      theme: DEFAULT_THEME_ID,
      colorScheme: 'system',
      motion: 'system',
    });
  });
});
