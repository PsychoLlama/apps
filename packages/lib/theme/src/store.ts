import { createStore, defineStore } from '@lib/state';
import type { ColorSchemeOption, MotionOption, ThemeId } from './constants';

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
 * Source of truth for the runtime theme selection.
 * `hydrateThemeEffect` seeds it from the prelude-set
 * `<html data-theme>` once the client mounts.
 */
export const themeStore = defineStore<ThemeState>(() => ({
  id: null,
}));

/** Live readonly view of the active theme. */
export const theme = createStore(themeStore);

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
 * `hydrateColorSchemeEffect` seeds it from the prelude-set
 * `<html data-color-scheme>` once the client mounts.
 */
export const colorSchemeStore = defineStore<ColorSchemeState>(() => ({
  id: null,
}));

/** Live readonly view of the active color-scheme override. */
export const colorScheme = createStore(colorSchemeStore);

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
 * Source of truth for the runtime motion override.
 * `hydrateMotionEffect` seeds it from the prelude-set
 * `<html data-reduced-motion>` once the client mounts.
 */
export const motionStore = defineStore<MotionState>(() => ({
  id: null,
}));

/** Live readonly view of the active motion override. */
export const motion = createStore(motionStore);
