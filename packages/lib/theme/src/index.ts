// Re-exporting from `./bundles.css` evaluates the module, which
// registers one `:root[data-theme="<id>"]` rule per variant. Swapping
// themes at runtime is a `data-theme` flip on `<html>` — no extra
// CSS fetch.
export { SWATCHES, THEMES } from './bundles.css';
export {
  DEFAULT_THEME_ID,
  THEME_ATTRIBUTE,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type ThemeId,
} from './constants';
