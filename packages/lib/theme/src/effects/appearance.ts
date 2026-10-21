import { collect } from '@lib/effects';
import {
  PREFERENCES,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  type Appearance,
  type ColorSchemeOption,
  type ThemeId,
} from '../constants';
import { $appearance, $appearanceChanged } from '../state/appearance';

// Mirror the active theme's page-background colors into the paired
// `<meta name="theme-color">` tags. The prelude does the same on first
// paint; this keeps the browser chrome in sync when the user swaps
// themes or color-schemes at runtime.
//
// An explicit `scheme` override collapses both tags onto the same
// color — without that, the OS-level `prefers-color-scheme` query
// baked into each tag's `media` attribute decides which one wins, and
// the address bar drifts out of sync with the app's forced scheme.
const syncThemeColorMeta = (id: ThemeId, scheme: ColorSchemeOption): void => {
  const colors = THEME_COLORS[id];
  const lightContent = scheme === 'dark' ? colors.dark : colors.light;
  const darkContent = scheme === 'light' ? colors.light : colors.dark;
  document
    .getElementById(THEME_COLOR_META_ID.light)
    ?.setAttribute('content', lightContent);
  document
    .getElementById(THEME_COLOR_META_ID.dark)
    ?.setAttribute('content', darkContent);
};

/**
 * Set one preference by name. `'system'` drops the attribute so
 * media queries take over, and a preference's fallback clears its stored
 * value so the next load follows whatever default ships. Storage goes
 * last: if it rejects, the switch still shows and `$appearance` still
 * matches.
 */
export const $setAppearance = collect(
  [$appearance, $appearanceChanged],
  (appearance, appearanceChanged) =>
    <Key extends keyof Appearance>(key: Key, value: Appearance[Key]): void => {
      const { attribute, fallback, storageKey } = PREFERENCES[key];
      const { dataset } = document.documentElement;
      if (value === 'system') delete dataset[attribute];
      else dataset[attribute] = value;

      appearanceChanged(key, value);
      syncThemeColorMeta(appearance.theme, appearance.colorScheme);

      if (value === fallback) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, value);
    },
);
