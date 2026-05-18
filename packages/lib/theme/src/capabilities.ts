import { createLogger } from '@lib/observability';
import {
  DEFAULT_THEME_ID,
  THEME_ATTRIBUTE,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type ThemeId,
} from './constants';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

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
        error: err instanceof Error ? err : new Error(String(err)),
      });
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
  guardStorageWrite('clear', () => {
    localStorage.removeItem(THEME_STORAGE_KEY);
  });
};
