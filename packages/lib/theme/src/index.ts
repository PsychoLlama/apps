// Re-exporting from `./bundles.css` evaluates the module, which
// registers one `:root[data-theme="<id>"]` rule per variant. Swapping
// themes at runtime is a `data-theme` flip on `<html>` — no extra
// CSS fetch.
//
// Build-time / styling-only API. The runtime store + effects live at
// `@lib/theme/runtime` so `.css.ts` consumers don't drag `@lib/state`
// and `@lib/observability` through Vanilla Extract's child compiler.
export { SWATCHES, THEMES } from './bundles.css';
export {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  THEME_ATTRIBUTE,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type ColorSchemeId,
  type ColorSchemeOption,
  type ThemeId,
} from './constants';
