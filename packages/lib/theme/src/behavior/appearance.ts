import { collect, reactive, resource } from '@lib/effects';
import { defineCell, defineCommand } from '@lib/state';
import {
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  type ColorSchemeOption,
} from '../constants';

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

// Follows what other tabs store. `storage` events never fire in the tab
// that wrote the value.
const $appearanceSync = collect([$appearanceChanged], (appearanceChanged) => {
  const sync = (event: StorageEvent) => {
    if (event.storageArea !== localStorage) return;

    // A `null` key means storage was cleared.
    if (event.key === COLOR_SCHEME_STORAGE_KEY || event.key === null) {
      appearanceChanged(parse(event.newValue));
    }
  };

  addEventListener('storage', sync);

  return resource(undefined, () => removeEventListener('storage', sync));
});

/**
 * The light/dark/system appearance, hydrated from storage and kept in
 * step with other tabs. Client-only; it reads `localStorage`.
 */
export const $appearance = collect(
  [$appearanceCell, $appearanceSync],
  (appearance) => reactive(appearance),
);
