// Register every theme up front. The build emits one
// `:root[data-theme="<id>"]` rule per theme; swapping themes at
// runtime is a `data-theme` flip on `<html>` — no extra CSS fetch.
import './bundles.css';

export { setThemeAction, theme } from './theme-store';
export { syncThemeAttribute } from './sync-attribute';
