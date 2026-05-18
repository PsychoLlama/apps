import { createStore, defineStore } from '@lib/state';
import type { ThemeId } from './constants';

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
