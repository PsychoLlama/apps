// Re-exporting from `./bundles.css` evaluates the module, which
// registers one `:root[data-theme="<id>"]` rule per variant. Swapping
// themes at runtime is a `data-theme` flip on `<html>` — no extra
// CSS fetch.
export {
  DEFAULT_THEME_ID,
  THEMES,
  THEME_ATTRIBUTE,
  THEME_IDS,
  type ThemeId,
} from './bundles.css';
