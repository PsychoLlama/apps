import { collect, pipe, reactive } from '@lib/effects';
import { defineCell, defineCommand } from '@lib/state';
import {
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  type ColorSchemeOption,
} from '../constants';
import { removeItem, setItem, watchStorage } from './local-storage';

// An unset or unrecognized value reads as `'system'`.
const parse = (stored: string | null): ColorSchemeOption =>
  COLOR_SCHEME_IDS.find((id) => id === stored) ?? 'system';

// Hydrated from storage. Never hold it bare, or it never hears from
// other tabs.
const $appearanceCell = defineCell(() =>
  parse(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)),
);

/** The appearance changed. */
export const $appearanceChanged = defineCommand(
  [$appearanceCell],
  ([, setAppearance]) =>
    (appearance: ColorSchemeOption) =>
      setAppearance(appearance),
);

const $appearanceSync = pipe([
  $appearanceChanged,
  watchStorage(COLOR_SCHEME_STORAGE_KEY, parse),
]);

/**
 * The light/dark/system appearance, hydrated from storage and kept in
 * step with other tabs. Client-only; it reads `localStorage`.
 */
export const $appearance = collect(
  [$appearanceCell, $appearanceSync],
  (appearance) => reactive(appearance),
);

/**
 * Switch the appearance, then persist it. `'system'` clears storage.
 * Storage that refuses access is skipped. Storage goes last: if it fails
 * otherwise, the switch still shows.
 */
export const $setAppearance = collect(
  [$appearanceChanged],
  (appearanceChanged) => (appearance: ColorSchemeOption) => {
    appearanceChanged(appearance);

    if (appearance === 'system') removeItem(COLOR_SCHEME_STORAGE_KEY);
    else setItem(COLOR_SCHEME_STORAGE_KEY, appearance);
  },
);
