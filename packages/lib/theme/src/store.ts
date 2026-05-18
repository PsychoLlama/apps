import { createStore, defineStore } from '@lib/state';
import { DEFAULT_THEME_ID, type ThemeId } from './constants';

/** Active theme selection mirrored onto `<html data-theme>`. */
export interface ThemeState {
  /** Identifier of the currently-applied theme variant. */
  id: ThemeId;
}

/**
 * Source of truth for the runtime theme selection. Initialized to
 * `DEFAULT_THEME_ID` so SSR has a stable value; `hydrateThemeEffect`
 * restamps from the prelude-set `<html data-theme>` once the client
 * mounts.
 */
export const themeStore = defineStore<ThemeState>(() => ({
  id: DEFAULT_THEME_ID,
}));

/** Live readonly view of the active theme. */
export const theme = createStore(themeStore);
