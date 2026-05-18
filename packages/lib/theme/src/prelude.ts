import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  THEME_ATTRIBUTE,
  THEME_IDS,
  THEME_STORAGE_KEY,
} from './constants';

// Compiled to a minified IIFE by `@dev/build/vite-plugin/inline-script`
// and inlined as a head script by `entry-server`. Runs before paint to
// restamp `<html data-theme>` and `<html data-color-scheme>` with the
// persisted selections — the SSG output already carries
// `DEFAULT_THEME_ID` and no color-scheme override, so missing or
// invalid stored values are no-ops and the defaults stay in place.
// JS-disabled visitors fall through cleanly for the same reason.
try {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme && (THEME_IDS as readonly string[]).includes(storedTheme)) {
    document.documentElement.dataset[THEME_ATTRIBUTE] = storedTheme;
  }

  const storedScheme = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  if (
    storedScheme &&
    (COLOR_SCHEME_IDS as readonly string[]).includes(storedScheme)
  ) {
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = storedScheme;
  }
} catch (err) {
  // `SecurityError` is expected in sandboxed iframes and "block all
  // cookies" configurations — keep the SSG-stamped defaults and stay
  // silent. Anything else points to a real bug worth surfacing.
  if (!(err instanceof DOMException) || err.name !== 'SecurityError') {
    // eslint-disable-next-line no-console
    console.error('[theme prelude]', err);
  }
}
