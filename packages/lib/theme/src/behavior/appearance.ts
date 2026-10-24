import { pipe } from '@lib/effects';
import { defineCell } from '@lib/state';
import {
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  type ColorSchemeOption,
} from '../constants';

// Seeded by whatever the earlier step yields. Never hold it bare, or it
// has nothing to seed from. An unset or unrecognized value reads as
// `'system'`.
const $appearanceCell = defineCell(
  (stored: string | null): ColorSchemeOption =>
    COLOR_SCHEME_IDS.find((id) => id === stored) ?? 'system',
);

/**
 * The light/dark/system appearance, hydrated from storage. Client-only;
 * it reads `localStorage`.
 */
export const $appearance = pipe([
  () => localStorage.getItem(COLOR_SCHEME_STORAGE_KEY),
  $appearanceCell,
]);
