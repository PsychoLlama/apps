import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  MOTION_ATTRIBUTE,
  MOTION_IDS,
  MOTION_STORAGE_KEY,
  THEME_ATTRIBUTE,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type ThemeId,
} from './constants';

// Compiled to a minified IIFE by `@dev/build/vite-plugin/inline-script`
// and inlined as a head script by `entry-server`. Runs before paint to
// restamp `<html data-theme>`, `<html data-color-scheme>`, and
// `<html data-reduced-motion>` with the persisted selections — the SSG
// output already carries `DEFAULT_THEME_ID` and no color-scheme or
// motion override, so missing or invalid stored values are no-ops and
// the defaults stay in place. JS-disabled visitors fall through cleanly
// for the same reason.
//
// HARD CONSTRAINT: every import in this file must be CSS-free. Pulling
// anything from a `.css.ts` module (directly or transitively) drags
// the Vanilla Extract bundle into the inlined IIFE and balloons the
// blocking head script. Stick to plain `.ts` data modules, and prefer
// `@lib/design/color/*` over `@lib/design/palette/*` when you need
// raw palette values. Keep the whole file as small as possible —
// every byte ships render-blocking on the critical path.
try {
  const root = document.documentElement;

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme && (THEME_IDS as readonly string[]).includes(storedTheme)) {
    root.dataset[THEME_ATTRIBUTE] = storedTheme;
  }

  const storedScheme = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  if (
    storedScheme &&
    (COLOR_SCHEME_IDS as readonly string[]).includes(storedScheme)
  ) {
    root.dataset[COLOR_SCHEME_ATTRIBUTE] = storedScheme;
  }

  const storedMotion = localStorage.getItem(MOTION_STORAGE_KEY);
  if (
    storedMotion &&
    (MOTION_IDS as readonly string[]).includes(storedMotion)
  ) {
    root.dataset[MOTION_ATTRIBUTE] = storedMotion;
  }

  // Swap `<meta name="theme-color">` content to match the active theme's
  // page background. When the user has forced a color-scheme override,
  // collapse both tags onto that variant's color so the OS-level
  // `prefers-color-scheme` query on each tag can't pick the wrong one.
  const activeTheme =
    (root.dataset[THEME_ATTRIBUTE] as ThemeId | undefined) ?? DEFAULT_THEME_ID;
  const activeScheme = root.dataset[COLOR_SCHEME_ATTRIBUTE];
  const colors = THEME_COLORS[activeTheme];
  document
    .getElementById(THEME_COLOR_META_ID.light)
    ?.setAttribute(
      'content',
      activeScheme === 'dark' ? colors.dark : colors.light,
    );
  document
    .getElementById(THEME_COLOR_META_ID.dark)
    ?.setAttribute(
      'content',
      activeScheme === 'light' ? colors.light : colors.dark,
    );
} catch (err) {
  // `SecurityError` is expected in sandboxed iframes and "block all
  // cookies" configurations — keep the SSG-stamped defaults and stay
  // silent. Anything else points to a real bug worth surfacing.
  if (!(err instanceof DOMException) || err.name !== 'SecurityError') {
    // eslint-disable-next-line no-console
    console.error('[theme prelude]', err);
  }
}
