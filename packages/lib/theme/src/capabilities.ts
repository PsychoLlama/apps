import { createLogger, toError } from '@lib/observability';
import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  THEME_ATTRIBUTE,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type ColorSchemeId,
  type ColorSchemeOption,
  type ThemeId,
} from './constants';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

const isThemeId = (value: string | undefined): value is ThemeId =>
  value !== undefined && (THEME_IDS as readonly string[]).includes(value);

const isColorSchemeId = (value: string | undefined): value is ColorSchemeId =>
  value !== undefined &&
  (COLOR_SCHEME_IDS as readonly string[]).includes(value);

/**
 * Read the active theme stamped onto `<html data-theme>`. The prelude
 * runs before paint and writes the persisted preference there, so the
 * DOM is the canonical post-prelude source — falling back to
 * `DEFAULT_THEME_ID` if the attribute is missing or unrecognized.
 */
export const readActiveTheme = (): ThemeId => {
  const value = document.documentElement.dataset[THEME_ATTRIBUTE];
  return isThemeId(value) ? value : DEFAULT_THEME_ID;
};

type StorageOp = 'persist' | 'clear';

const guardStorageWrite = (op: StorageOp, write: () => void): void => {
  try {
    write();
  } catch (err) {
    // `SecurityError` is expected in sandboxed iframes and "block all
    // cookies" configurations — losing persistence is acceptable; the
    // attribute write above still takes effect for the session. Anything
    // else points to a real bug worth surfacing.
    if (!(err instanceof DOMException) || err.name !== 'SecurityError') {
      logger.error('Failed to update theme preference', {
        op,
        error: toError(err),
      });
    }
  }
};

/**
 * Mirror the active theme's page-background colors into the paired
 * `<meta name="theme-color">` tags. The prelude does the same on first
 * paint; this keeps the browser chrome in sync when the user swaps
 * themes or color-schemes at runtime.
 *
 * An explicit `scheme` override collapses both tags onto the same
 * color — without that, the OS-level `prefers-color-scheme` query
 * baked into each tag's `media` attribute decides which one wins, and
 * the address bar drifts out of sync with the app's forced scheme.
 */
const syncThemeColorMeta = (id: ThemeId, scheme: ColorSchemeOption): void => {
  const colors = THEME_COLORS[id];
  const lightContent = scheme === 'dark' ? colors.dark : colors.light;
  const darkContent = scheme === 'light' ? colors.light : colors.dark;
  document
    .getElementById(THEME_COLOR_META_ID.light)
    ?.setAttribute('content', lightContent);
  document
    .getElementById(THEME_COLOR_META_ID.dark)
    ?.setAttribute('content', darkContent);
};

/**
 * Flip `<html data-theme>` to the requested variant and persist the
 * choice so the prelude can restore it before paint on the next load.
 * DOM write happens first so the visual switch survives a localStorage
 * failure.
 */
export const applyTheme = (id: ThemeId): void => {
  document.documentElement.dataset[THEME_ATTRIBUTE] = id;
  syncThemeColorMeta(id, readActiveColorScheme());
  guardStorageWrite('persist', () => {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  });
};

/**
 * Forget any persisted preference and snap `<html data-theme>` back to
 * `DEFAULT_THEME_ID`. Semantically distinct from
 * `applyTheme(DEFAULT_THEME_ID)`: dropping the key means the prelude
 * will pick up whatever default ships on the next load, even if that
 * default changes.
 */
export const resetTheme = (): void => {
  document.documentElement.dataset[THEME_ATTRIBUTE] = DEFAULT_THEME_ID;
  syncThemeColorMeta(DEFAULT_THEME_ID, readActiveColorScheme());
  guardStorageWrite('clear', () => {
    localStorage.removeItem(THEME_STORAGE_KEY);
  });
};

/**
 * Read the active color-scheme override stamped onto
 * `<html data-color-scheme>`. Returns `'system'` when no override is
 * present — that's the no-attribute state that hands control back to
 * `@media (prefers-color-scheme)`.
 */
export const readActiveColorScheme = (): ColorSchemeOption => {
  const value = document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
  return isColorSchemeId(value) ? value : 'system';
};

/**
 * Force a color-scheme override or hand control back to the system
 * preference. `'system'` clears both the DOM attribute and the
 * persisted key — a missing attribute is the canonical no-override
 * state, and a missing key means the prelude won't restamp on reload.
 * DOM write happens first so the visual switch survives a localStorage
 * failure.
 */
export const applyColorScheme = (option: ColorSchemeOption): void => {
  if (option === 'system') {
    delete document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
    syncThemeColorMeta(readActiveTheme(), 'system');
    guardStorageWrite('clear', () => {
      localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY);
    });
    return;
  }

  document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = option;
  syncThemeColorMeta(readActiveTheme(), option);
  guardStorageWrite('persist', () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, option);
  });
};
