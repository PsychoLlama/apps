import { createSignal } from 'solid-js';
import { pipe, reactive } from '@lib/effects';
import type { ColorSchemeId } from '../constants';

const query = '(prefers-color-scheme: dark)';

/**
 * The OS color-scheme preference, as a live accessor. Ignores the app's
 * override; pair it with `$appearance` for the scheme on screen.
 * Client-only; it reads `matchMedia`.
 */
export const $systemColorScheme = pipe([
  () => {
    const media = matchMedia(query);
    const read = (matches: boolean): ColorSchemeId =>
      matches ? 'dark' : 'light';

    const [scheme, setScheme] = createSignal(read(media.matches));
    const update = (event: MediaQueryListEvent) =>
      setScheme(read(event.matches));

    media.addEventListener('change', update);
    return reactive(scheme, () => media.removeEventListener('change', update));
  },
]);
