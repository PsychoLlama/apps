import { collect } from '@lib/effects';
import type { Appearance } from '../constants';
import { PREFERENCES, syncThemeColorMeta } from '../dom';
import { $appearance, $appearanceChanged } from '../state/appearance';

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
