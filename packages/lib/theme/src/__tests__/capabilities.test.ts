import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  THEME_ATTRIBUTE,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  THEME_STORAGE_KEY,
} from '../constants';
import {
  applyColorScheme,
  applyTheme,
  readActiveColorScheme,
  readActiveTheme,
  resetTheme,
} from '../capabilities';

const mountMetaTag = (id: string): HTMLMetaElement => {
  const meta = document.createElement('meta');
  meta.id = id;
  document.head.appendChild(meta);
  return meta;
};

beforeEach(() => {
  delete document.documentElement.dataset[THEME_ATTRIBUTE];
  delete document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
  document.getElementById(THEME_COLOR_META_ID.light)?.remove();
  document.getElementById(THEME_COLOR_META_ID.dark)?.remove();
  mountMetaTag(THEME_COLOR_META_ID.light);
  mountMetaTag(THEME_COLOR_META_ID.dark);
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

  it("syncs the paired theme-color meta tags to the variant's colors", () => {
    applyTheme('jade');

    const light = document.getElementById(THEME_COLOR_META_ID.light);
    const dark = document.getElementById(THEME_COLOR_META_ID.dark);
    expect(light?.getAttribute('content')).toBe(THEME_COLORS.jade.light);
    expect(dark?.getAttribute('content')).toBe(THEME_COLORS.jade.dark);
  });

  it('collapses both theme-color meta tags onto the dark variant when forced dark', () => {
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'dark';

    applyTheme('jade');

    const light = document.getElementById(THEME_COLOR_META_ID.light);
    const dark = document.getElementById(THEME_COLOR_META_ID.dark);
    expect(light?.getAttribute('content')).toBe(THEME_COLORS.jade.dark);
    expect(dark?.getAttribute('content')).toBe(THEME_COLORS.jade.dark);
  });

  it('collapses both theme-color meta tags onto the light variant when forced light', () => {
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'light';

    applyTheme('jade');

    const light = document.getElementById(THEME_COLOR_META_ID.light);
    const dark = document.getElementById(THEME_COLOR_META_ID.dark);
    expect(light?.getAttribute('content')).toBe(THEME_COLORS.jade.light);
    expect(dark?.getAttribute('content')).toBe(THEME_COLORS.jade.light);
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

  it("syncs the paired theme-color meta tags to the default variant's colors", () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';

    resetTheme();

    const light = document.getElementById(THEME_COLOR_META_ID.light);
    const dark = document.getElementById(THEME_COLOR_META_ID.dark);
    expect(light?.getAttribute('content')).toBe(
      THEME_COLORS[DEFAULT_THEME_ID].light,
    );
    expect(dark?.getAttribute('content')).toBe(
      THEME_COLORS[DEFAULT_THEME_ID].dark,
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

describe('readActiveColorScheme', () => {
  it('returns the validated value stamped on <html>', () => {
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'dark';

    expect(readActiveColorScheme()).toBe('dark');
  });

  it("returns 'system' when the attribute is missing", () => {
    expect(readActiveColorScheme()).toBe('system');
  });

  it("returns 'system' when the attribute is unrecognized", () => {
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'sepia';

    expect(readActiveColorScheme()).toBe('system');
  });
});

describe('applyColorScheme', () => {
  it('flips <html data-color-scheme> to the requested override', () => {
    applyColorScheme('dark');

    expect(document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE]).toBe(
      'dark',
    );
  });

  it('persists the override to localStorage', () => {
    applyColorScheme('light');

    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('light');
  });

  it("drops the attribute when set to 'system'", () => {
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'dark';

    applyColorScheme('system');

    expect(
      document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE],
    ).toBeUndefined();
  });

  it("clears the persisted preference when set to 'system'", () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');

    applyColorScheme('system');

    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBeNull();
  });

  it('still flips the DOM when localStorage rejects', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    expect(() => applyColorScheme('dark')).not.toThrow();
    expect(document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE]).toBe(
      'dark',
    );

    setItem.mockRestore();
  });

  it("collapses both theme-color meta tags onto the active theme's dark variant when forced dark", () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';

    applyColorScheme('dark');

    const light = document.getElementById(THEME_COLOR_META_ID.light);
    const dark = document.getElementById(THEME_COLOR_META_ID.dark);
    expect(light?.getAttribute('content')).toBe(THEME_COLORS.jade.dark);
    expect(dark?.getAttribute('content')).toBe(THEME_COLORS.jade.dark);
  });

  it("collapses both theme-color meta tags onto the active theme's light variant when forced light", () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';

    applyColorScheme('light');

    const light = document.getElementById(THEME_COLOR_META_ID.light);
    const dark = document.getElementById(THEME_COLOR_META_ID.dark);
    expect(light?.getAttribute('content')).toBe(THEME_COLORS.jade.light);
    expect(dark?.getAttribute('content')).toBe(THEME_COLORS.jade.light);
  });

  it("restores the per-scheme theme-color split when reset to 'system'", () => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = 'jade';
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'dark';
    document
      .getElementById(THEME_COLOR_META_ID.light)
      ?.setAttribute('content', THEME_COLORS.jade.dark);
    document
      .getElementById(THEME_COLOR_META_ID.dark)
      ?.setAttribute('content', THEME_COLORS.jade.dark);

    applyColorScheme('system');

    const light = document.getElementById(THEME_COLOR_META_ID.light);
    const dark = document.getElementById(THEME_COLOR_META_ID.dark);
    expect(light?.getAttribute('content')).toBe(THEME_COLORS.jade.light);
    expect(dark?.getAttribute('content')).toBe(THEME_COLORS.jade.dark);
  });

  it("still drops the attribute when localStorage rejects on 'system'", () => {
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'light';
    const removeItem = vi
      .spyOn(Storage.prototype, 'removeItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

    expect(() => applyColorScheme('system')).not.toThrow();
    expect(
      document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE],
    ).toBeUndefined();

    removeItem.mockRestore();
  });
});
