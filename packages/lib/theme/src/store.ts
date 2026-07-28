import { defineFold, defineStore, defineTopic } from '@lib/state-next';
import { DEFAULT_THEME_ID } from './constants';
import type { ColorSchemeOption, MotionOption, ThemeId } from './constants';
import { themeScope } from './scope';

/** Active theme selection mirrored onto `<html data-theme>`. */
export interface ThemeState {
  /**
   * Identifier of the currently-applied theme variant, or `null` until
   * the client has hydrated from `<html data-theme>`. The site is SSG'd,
   * so the server can't know the persisted preference — leaving this
   * unset keeps pickers from flashing the wrong selection before the
   * prelude-stamped value is read.
   */
  id: ThemeId | null;
}

/**
 * Source of truth for the runtime theme selection. `hydrateThemeSaga`
 * seeds it from the prelude-set `<html data-theme>` once the client
 * mounts.
 */
export const themeStore = defineStore<ThemeState>(themeScope, () => ({
  id: null,
}));

/** The client read the theme the prelude had already stamped on `<html>`. */
export const themeRestoredTopic = defineTopic<ThemeId>();
defineFold(themeRestoredTopic, [themeStore], (theme, id) => {
  theme.id = id;
});

/** Someone picked a theme. */
export const themeSelectedTopic = defineTopic<ThemeId>();
defineFold(themeSelectedTopic, [themeStore], (theme, id) => {
  theme.id = id;
});

/** The theme preference was forgotten, falling back to the default. */
export const themeResetTopic = defineTopic();
defineFold(themeResetTopic, [themeStore], (theme) => {
  theme.id = DEFAULT_THEME_ID;
});

/** Active color-scheme override mirrored onto `<html data-color-scheme>`. */
export interface ColorSchemeState {
  /**
   * Selected appearance option, or `null` until the client hydrates.
   * `'system'` is a real selection (no override); `null` is the
   * pre-hydration state and keeps pickers from flashing the wrong
   * card before the prelude-stamped value is read.
   */
  id: ColorSchemeOption | null;
}

/**
 * Source of truth for the runtime color-scheme override.
 * `hydrateColorSchemeSaga` seeds it from the prelude-set
 * `<html data-color-scheme>` once the client mounts.
 */
export const colorSchemeStore = defineStore<ColorSchemeState>(
  themeScope,
  () => ({ id: null }),
);

/**
 * The client read the color-scheme override the prelude had already
 * stamped on `<html>`.
 */
export const colorSchemeRestoredTopic = defineTopic<ColorSchemeOption>();
defineFold(colorSchemeRestoredTopic, [colorSchemeStore], (scheme, id) => {
  scheme.id = id;
});

/**
 * Someone picked an appearance. `'system'` is a selection like any other —
 * it means "no override", not "not yet known".
 */
export const colorSchemeSelectedTopic = defineTopic<ColorSchemeOption>();
defineFold(colorSchemeSelectedTopic, [colorSchemeStore], (scheme, id) => {
  scheme.id = id;
});

/** Active motion override mirrored onto `<html data-reduced-motion>`. */
export interface MotionState {
  /**
   * Selected motion option, or `null` until the client hydrates.
   * `'system'` is a real selection (no override); `null` is the
   * pre-hydration state and keeps the picker from flashing the wrong
   * card before the prelude-stamped value is read.
   */
  id: MotionOption | null;
}

/**
 * Source of truth for the runtime motion override. `hydrateMotionSaga`
 * seeds it from the prelude-set `<html data-reduced-motion>` once the
 * client mounts.
 */
export const motionStore = defineStore<MotionState>(themeScope, () => ({
  id: null,
}));

/**
 * The client read the motion override the prelude had already stamped on
 * `<html>`.
 */
export const motionRestoredTopic = defineTopic<MotionOption>();
defineFold(motionRestoredTopic, [motionStore], (motion, id) => {
  motion.id = id;
});

/** Someone picked a motion preference. */
export const motionSelectedTopic = defineTopic<MotionOption>();
defineFold(motionSelectedTopic, [motionStore], (motion, id) => {
  motion.id = id;
});
