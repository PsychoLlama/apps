import {
  DEFAULT_THEME_ID,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
} from '../constants';
import { applyTheme, readActiveTheme, resetTheme } from '../capabilities';

beforeEach(() => {
  delete document.documentElement.dataset[THEME_ATTRIBUTE];
  localStorage.clear();
});

describe('readActiveTheme', () => {
  it('returns the validated value stamped on <html>', () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';

    expect(readActiveTheme()).toBe('jade');
  });

  it('falls back to the default when the attribute is missing', () => {
    expect(readActiveTheme()).toBe(DEFAULT_THEME_ID);
  });

  it('falls back to the default when the attribute is unrecognized', () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'not-a-theme';

    expect(readActiveTheme()).toBe(DEFAULT_THEME_ID);
  });
});

describe('applyTheme', () => {
  it('flips <html data-theme> to the requested variant', () => {
    applyTheme('purple');

    expect(document.documentElement.dataset[THEME_ATTRIBUTE]).toBe('purple');
  });

  it('persists the choice to localStorage', () => {
    applyTheme('teal');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('teal');
  });

  it('still flips the DOM when localStorage rejects', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    expect(() => applyTheme('pink')).not.toThrow();
    expect(document.documentElement.dataset[THEME_ATTRIBUTE]).toBe('pink');

    setItem.mockRestore();
  });

  it('does not surface unexpected localStorage failures to the caller', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota');
      });

    expect(() => applyTheme('orange')).not.toThrow();
    expect(document.documentElement.dataset[THEME_ATTRIBUTE]).toBe('orange');

    setItem.mockRestore();
  });
});

describe('resetTheme', () => {
  it('stamps the default onto <html data-theme>', () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';

    resetTheme();

    expect(document.documentElement.dataset[THEME_ATTRIBUTE]).toBe(
      DEFAULT_THEME_ID,
    );
  });

  it('drops the persisted preference so the prelude picks up the live default', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'jade');

    resetTheme();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('still stamps the DOM when localStorage rejects', () => {
    const removeItem = vi
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    expect(() => resetTheme()).not.toThrow();
    expect(document.documentElement.dataset[THEME_ATTRIBUTE]).toBe(
      DEFAULT_THEME_ID,
    );

    removeItem.mockRestore();
  });
});
