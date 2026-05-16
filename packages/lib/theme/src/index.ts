// Eagerly pull every theme bundle into the build so vanilla-extract
// emits one `:root[data-theme="<id>"]` rule per theme. Swapping themes
// at runtime is a `data-theme` flip on `<html>` — no extra CSS fetch.
import './bundles/blue.css.ts';
import './bundles/brown.css.ts';
import './bundles/cyan.css.ts';
import './bundles/indigo.css.ts';
import './bundles/iris.css.ts';
import './bundles/jade.css.ts';
import './bundles/orange.css.ts';
import './bundles/pink.css.ts';
import './bundles/plum.css.ts';
import './bundles/purple.css.ts';
import './bundles/sky.css.ts';
import './bundles/teal.css.ts';
import './bundles/violet.css.ts';

export { setThemeAction, theme } from './theme-store';
export { syncThemeAttribute } from './sync-attribute';
