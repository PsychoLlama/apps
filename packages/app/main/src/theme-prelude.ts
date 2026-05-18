import {
  THEME_ATTRIBUTE,
  THEME_IDS,
  THEME_STORAGE_KEY,
} from '@lib/theme/constants';

// Compiled to a minified IIFE by `@dev/build/vite-plugin/inline-script`
// and inlined as a head script by `entry-server`. Runs before paint to
// restamp `<html data-theme>` with the persisted selection — the SSG
// output already carries `DEFAULT_THEME_ID`, so a missing or invalid
// stored value is a no-op and the default stays in place. JS-disabled
// visitors fall through cleanly for the same reason.
//
// Defensive try/catch: localStorage access itself throws in sandboxed
// iframes and a few cookies-disabled configurations. We never want a
// page-wide failure for a cosmetic preference.
try {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && (THEME_IDS as readonly string[]).includes(stored)) {
    document.documentElement.dataset[THEME_ATTRIBUTE] = stored;
  }
} catch {
  /* no-op — keep the SSG-stamped default. */
}
