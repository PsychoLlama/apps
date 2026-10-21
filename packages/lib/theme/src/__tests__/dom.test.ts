import {
  COLOR_SCHEME_ATTRIBUTE,
  DEFAULT_THEME_ID,
  MOTION_ATTRIBUTE,
  THEME_ATTRIBUTE,
} from '../constants';
import { readAppearance } from '../dom';

beforeEach(() => {
  delete document.documentElement.dataset[THEME_ATTRIBUTE];
  delete document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
  delete document.documentElement.dataset[MOTION_ATTRIBUTE];
});

describe('readAppearance', () => {
  it('reads every preference stamped on <html>', () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'dark';
    document.documentElement.dataset[MOTION_ATTRIBUTE] = 'reduce';

    expect(readAppearance()).toEqual({
      theme: 'jade',
      colorScheme: 'dark',
      motion: 'reduce',
    });
  });

  it('falls back when the attributes are missing', () => {
    expect(readAppearance()).toEqual({
      theme: DEFAULT_THEME_ID,
      colorScheme: 'system',
      motion: 'system',
    });
  });

  it('falls back when the attributes are unrecognized', () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'not-a-theme';
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'sepia';
    document.documentElement.dataset[MOTION_ATTRIBUTE] = 'jerky';

    expect(readAppearance()).toEqual({
      theme: DEFAULT_THEME_ID,
      colorScheme: 'system',
      motion: 'system',
    });
  });
});
