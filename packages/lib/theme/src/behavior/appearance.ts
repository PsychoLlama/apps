import { createSignal } from 'solid-js';
import { collect, pipe, reactive } from '@lib/effects';
import { createCell, defineCommand } from '@lib/state';
import {
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  type ColorSchemeId,
  type ColorSchemeOption,
} from '../constants';
import { removeItem, setItem, watchStorage } from './local-storage';

// An unset or unrecognized value reads as `'system'`.
const parse = (stored: string | null): ColorSchemeOption =>
  COLOR_SCHEME_IDS.find((id) => id === stored) ?? 'system';

/**
 * The light/dark/system appearance, hydrated from storage and kept in
 * step with other tabs. Client-only; it reads `localStorage`.
 */
export const $appearance = pipe([
  () => {
    const [appearance, setAppearance] = createCell(
      parse(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)),
    );

    return reactive(
      appearance,
      watchStorage(COLOR_SCHEME_STORAGE_KEY, parse, setAppearance),
    );
  },
]);

/** The appearance changed. */
export const $appearanceChanged = defineCommand(
  [$appearance],
  ([, setAppearance]) =>
    (appearance: ColorSchemeOption) =>
      setAppearance(appearance),
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

/**
 * The OS color-scheme preference, as a live accessor. Ignores the app's
 * override; pair it with `$appearance` for the scheme on screen.
 * Client-only; it reads `matchMedia`.
 */
export const $systemColorScheme = pipe([
  () => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const read = (matches: boolean): ColorSchemeId =>
      matches ? 'dark' : 'light';

    const [scheme, setScheme] = createSignal(read(media.matches));
    const update = (event: MediaQueryListEvent) =>
      setScheme(read(event.matches));

    media.addEventListener('change', update);
    return reactive(scheme, () => media.removeEventListener('change', update));
  },
]);
