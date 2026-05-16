// One `.css.ts` aggregator pulls every theme bundle through
// vanilla-extract so the build emits one `:root[data-theme="<id>"]`
// rule per theme. Swapping themes at runtime is a `data-theme` flip
// on `<html>` — no extra CSS fetch.
import './bundles.css';

export { setThemeAction, theme } from './theme-store';
export { syncThemeAttribute } from './sync-attribute';
