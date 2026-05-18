import { createTestBindings } from '@lib/state';
import {
  hydrateColorSchemeEffect,
  hydrateThemeEffect,
  resetThemeEffect,
  selectColorSchemeEffect,
  selectThemeEffect,
  setColorScheme,
  setTheme,
} from '../bindings';
import * as capabilities from '../capabilities';
import { DEFAULT_THEME_ID } from '../constants';
import { colorSchemeStore, themeStore } from '../store';

// Bindings tests assert on state transitions only. Capability behavior —
// DOM writes, localStorage persistence, attribute validation — lives in
// capabilities tests.
vi.mock('../capabilities', () => ({
  applyColorScheme: vi.fn(),
  applyTheme: vi.fn(),
  readActiveColorScheme: vi.fn(),
  readActiveTheme: vi.fn(),
  resetTheme: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(capabilities.applyColorScheme).mockReset();
  vi.mocked(capabilities.applyTheme).mockReset();
  vi.mocked(capabilities.readActiveColorScheme).mockReset();
  vi.mocked(capabilities.readActiveTheme).mockReset();
  vi.mocked(capabilities.resetTheme).mockReset();
});

const setup = () => {
  const bindings = createTestBindings();
  return {
    ...bindings,
    theme: bindings.createStore(themeStore),
    colorScheme: bindings.createStore(colorSchemeStore),
  };
};

describe('themeStore', () => {
  it('starts unhydrated so SSG can render with no selection', () => {
    const { theme } = setup();

    expect(theme.id).toBeNull();
  });
});

describe('setTheme', () => {
  it('updates the active theme id', () => {
    const { theme, useAction } = setup();

    useAction(setTheme)('jade');

    expect(theme.id).toBe('jade');
  });
});

describe('selectThemeEffect', () => {
  it('updates state synchronously before the side effect runs', () => {
    const { theme, useEffect } = setup();
    let observed: string | null = null;
    vi.mocked(capabilities.applyTheme).mockImplementation(() => {
      observed = theme.id;
    });

    useEffect(selectThemeEffect)('purple');

    // `onStart` fires before the callback, so the capability sees the
    // post-dispatch state — confirming UI gets the value before the
    // DOM/localStorage write.
    expect(observed).toBe('purple');
    expect(theme.id).toBe('purple');
  });

  it('forwards the selection to the apply capability', () => {
    const { useEffect } = setup();

    useEffect(selectThemeEffect)('teal');

    expect(capabilities.applyTheme).toHaveBeenCalledWith('teal');
  });
});

describe('resetThemeEffect', () => {
  it('rewinds state to the default before the side effect runs', () => {
    const { theme, useAction, useEffect } = setup();
    useAction(setTheme)('jade');
    let observed: string | null = null;
    vi.mocked(capabilities.resetTheme).mockImplementation(() => {
      observed = theme.id;
    });

    useEffect(resetThemeEffect)();

    expect(observed).toBe(DEFAULT_THEME_ID);
    expect(theme.id).toBe(DEFAULT_THEME_ID);
  });

  it('invokes the reset capability so the persisted preference is dropped', () => {
    const { useEffect } = setup();

    useEffect(resetThemeEffect)();

    expect(capabilities.resetTheme).toHaveBeenCalledTimes(1);
  });
});

describe('hydrateThemeEffect', () => {
  it('seeds the store with the value read from the DOM', () => {
    vi.mocked(capabilities.readActiveTheme).mockReturnValue('pink');
    const { theme, useEffect } = setup();

    useEffect(hydrateThemeEffect)();

    expect(theme.id).toBe('pink');
  });
});

describe('colorSchemeStore', () => {
  it('starts unhydrated so SSG can render with no selection', () => {
    const { colorScheme } = setup();

    expect(colorScheme.id).toBeNull();
  });
});

describe('setColorScheme', () => {
  it('updates the active color-scheme selection', () => {
    const { colorScheme, useAction } = setup();

    useAction(setColorScheme)('dark');

    expect(colorScheme.id).toBe('dark');
  });
});

describe('selectColorSchemeEffect', () => {
  it('updates state synchronously before the side effect runs', () => {
    const { colorScheme, useEffect } = setup();
    let observed: string | null = null;
    vi.mocked(capabilities.applyColorScheme).mockImplementation(() => {
      observed = colorScheme.id;
    });

    useEffect(selectColorSchemeEffect)('dark');

    // `onStart` fires before the callback, so the capability sees the
    // post-dispatch state — confirming UI gets the value before the
    // DOM/localStorage write.
    expect(observed).toBe('dark');
    expect(colorScheme.id).toBe('dark');
  });

  it('forwards the selection to the apply capability', () => {
    const { useEffect } = setup();

    useEffect(selectColorSchemeEffect)('light');

    expect(capabilities.applyColorScheme).toHaveBeenCalledWith('light');
  });

  it("propagates 'system' as a regular selection", () => {
    const { colorScheme, useEffect } = setup();

    useEffect(selectColorSchemeEffect)('system');

    expect(colorScheme.id).toBe('system');
    expect(capabilities.applyColorScheme).toHaveBeenCalledWith('system');
  });
});

describe('hydrateColorSchemeEffect', () => {
  it('seeds the store with the value read from the DOM', () => {
    vi.mocked(capabilities.readActiveColorScheme).mockReturnValue('dark');
    const { colorScheme, useEffect } = setup();

    useEffect(hydrateColorSchemeEffect)();

    expect(colorScheme.id).toBe('dark');
  });
});
