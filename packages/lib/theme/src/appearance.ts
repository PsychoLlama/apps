import { defineFold, defineStore, defineTopic } from '@lib/state';
import { DEFAULT_THEME_ID } from './constants';
import type { AppearanceSelection, ThemeId } from './constants';
import { appearanceScope } from './scope';

/**
 * The theme preference mirrored onto `<html>`. The color scheme and
 * motion live in `$colorScheme` and `$motion` instead.
 *
 * Each field is `null` until the client hydrates. The site is SSG'd, so
 * the server can't know the persisted preferences; leaving them unset
 * keeps the pickers from flashing a wrong selection before the
 * prelude-stamped values are read.
 */
export interface AppearanceState {
  /** Identifier of the currently-applied theme variant. */
  theme: ThemeId | null;
}

/**
 * Source of truth for the runtime appearance selection.
 * `hydrateAppearanceSaga` seeds it from the prelude-stamped `<html>`
 * attributes once the client mounts.
 */
export const appearanceStore = defineStore<AppearanceState>(
  appearanceScope,
  () => ({ theme: null }),
);

/**
 * The client read the appearance the prelude had already stamped on
 * `<html>`.
 */
export const appearanceRestoredTopic = defineTopic<AppearanceSelection>();
defineFold(
  appearanceRestoredTopic,
  [appearanceStore],
  (appearance, selection) => {
    appearance.theme = selection.theme;
  },
);

/** Someone picked a theme. */
export const themeSelectedTopic = defineTopic<ThemeId>();
defineFold(themeSelectedTopic, [appearanceStore], (appearance, id) => {
  appearance.theme = id;
});

/** The theme preference was forgotten, falling back to the default. */
export const themeResetTopic = defineTopic();
defineFold(themeResetTopic, [appearanceStore], (appearance) => {
  appearance.theme = DEFAULT_THEME_ID;
});
