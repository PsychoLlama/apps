import { defineFold, defineStore, defineTopic } from '@lib/state-next';
import { DEFAULT_THEME_ID } from './constants';
import type {
  AppearanceSelection,
  ColorSchemeOption,
  MotionOption,
  ThemeId,
} from './constants';
import { appearanceScope } from './scope';

/**
 * The appearance preferences mirrored onto `<html>`: theme,
 * color-scheme, and motion. One record rather than three because they
 * share everything that matters — the same lifetime, the same source
 * (attributes the prelude stamps before paint), and the same surface.
 *
 * Each field is `null` until the client hydrates. The site is SSG'd, so
 * the server can't know the persisted preferences; leaving them unset
 * keeps the pickers from flashing a wrong selection before the
 * prelude-stamped values are read.
 */
export interface AppearanceState {
  /** Identifier of the currently-applied theme variant. */
  theme: ThemeId | null;

  /**
   * Selected color-scheme option. `'system'` is a real selection — it
   * means "no override", not "not yet known".
   */
  colorScheme: ColorSchemeOption | null;

  /** Selected motion option. `'system'` is a real selection, as above. */
  motion: MotionOption | null;
}

/**
 * Source of truth for the runtime appearance selection.
 * `hydrateAppearanceSaga` seeds it from the prelude-stamped `<html>`
 * attributes once the client mounts.
 */
export const appearanceStore = defineStore<AppearanceState>(
  appearanceScope,
  () => ({ theme: null, colorScheme: null, motion: null }),
);

/**
 * The client read the appearance the prelude had already stamped on
 * `<html>`. One fact for all three preferences: they're read in a single
 * pass and land in a single transition, so no surface ever renders a
 * half-hydrated picker set.
 */
export const appearanceRestoredTopic = defineTopic<AppearanceSelection>();
defineFold(
  appearanceRestoredTopic,
  [appearanceStore],
  (appearance, selection) => {
    appearance.theme = selection.theme;
    appearance.colorScheme = selection.colorScheme;
    appearance.motion = selection.motion;
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

/** Someone picked a color scheme. */
export const colorSchemeSelectedTopic = defineTopic<ColorSchemeOption>();
defineFold(colorSchemeSelectedTopic, [appearanceStore], (appearance, id) => {
  appearance.colorScheme = id;
});

/** Someone picked a motion preference. */
export const motionSelectedTopic = defineTopic<MotionOption>();
defineFold(motionSelectedTopic, [appearanceStore], (appearance, id) => {
  appearance.motion = id;
});
