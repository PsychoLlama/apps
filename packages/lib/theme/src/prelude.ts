import { THEME_ATTRIBUTE, THEME_IDS, THEME_STORAGE_KEY } from './constants';

// Compiled to a minified IIFE by `@dev/build/vite-plugin/inline-script`
// and inlined as a head script by `entry-server`. Runs before paint to
// restamp `<html data-theme>` with the persisted selection — the SSG
// output already carries `DEFAULT_THEME_ID`, so a missing or invalid
// stored value is a no-op and the default stays in place. JS-disabled
// visitors fall through cleanly for the same reason.
try {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && (THEME_IDS as readonly string[]).includes(stored)) {
    document.documentElement.dataset[THEME_ATTRIBUTE] = stored;
  }
} catch (err) {
  // `SecurityError` is expected in sandboxed iframes and "block all
  // cookies" configurations — keep the SSG-stamped default and stay
  // silent. Anything else points to a real bug worth surfacing.
  if (!(err instanceof DOMException) || err.name !== 'SecurityError') {
    // eslint-disable-next-line no-console
    console.error('[theme prelude]', err);
  }
}
