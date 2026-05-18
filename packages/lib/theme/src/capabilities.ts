import {
  DEFAULT_THEME_ID,
  THEME_ATTRIBUTE,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type ThemeId,
} from './constants';

const isThemeId = (value: string | undefined): value is ThemeId =>
  value !== undefined && (THEME_IDS as readonly string[]).includes(value);

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

const writeStoredTheme = (id: ThemeId): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch (err) {
    // `SecurityError` is expected in sandboxed iframes and "block all
    // cookies" configurations — losing persistence is acceptable; the
    // attribute write below still takes effect for the session. Anything
    // else points to a real bug worth surfacing.
    if (!(err instanceof DOMException) || err.name !== 'SecurityError') {
      // eslint-disable-next-line no-console
      console.error('[theme]', err);
    }
  }
};

/**
 * Flip `<html data-theme>` to the requested variant and persist the
 * choice so the prelude can restore it before paint on the next load.
 * DOM write happens first so the visual switch survives a localStorage
 * failure.
 */
export const applyTheme = (id: ThemeId): void => {
  document.documentElement.dataset[THEME_ATTRIBUTE] = id;
  writeStoredTheme(id);
};
