import { createStore, defineAction, defineStore } from '@lib/state';
import type { ThemeId } from './catalog.css';

/** Active-theme state held in the shared registry. */
interface ThemeState {
  /** Identifier of the active theme bundle. */
  id: ThemeId;
}

const themeStore = defineStore<ThemeState>(() => ({
  id: 'blue',
}));

/** Readonly view of the active theme. */
export const theme = createStore(themeStore);

/** Set the active theme by id. */
export const setThemeAction = defineAction(
  [themeStore],
  (state, next: ThemeId) => {
    state.id = next;
  },
);
