import { call, commit, defineSaga } from '@lib/state';
import { applyTheme, readActiveAppearance, resetTheme } from './capabilities';
import type { ThemeId } from './constants';
import { appearanceScope } from './scope';
import {
  appearanceRestoredTopic,
  themeResetTopic,
  themeSelectedTopic,
} from './appearance';

/**
 * Mirror the prelude-stamped `<html data-theme>` into the store. Run once
 * per surface on mount — the prelude is the canonical pre-paint setter, so
 * the store just learns what's already on screen.
 */
export const hydrateAppearanceSaga = defineSaga(
  appearanceScope,
  async function* () {
    const selection = yield* call(readActiveAppearance);
    yield commit(appearanceRestoredTopic(selection));
  },
);

/**
 * Switch the active theme. Commits first so the UI reacts synchronously,
 * then flips `<html data-theme>` and persists the choice via localStorage
 * so it survives reload.
 */
export const selectThemeSaga = defineSaga(
  appearanceScope,
  async function* (id: ThemeId) {
    yield commit(themeSelectedTopic(id));
    yield* call(applyTheme, id);
  },
);

/**
 * Forget the persisted preference and restore the default theme. Side
 * effects mirror {@link selectThemeSaga}, but localStorage drops the key —
 * so the next load picks up whatever default ships, rather than the value
 * the user happened to land on.
 */
export const resetThemeSaga = defineSaga(appearanceScope, async function* () {
  yield commit(themeResetTopic());
  yield* call(resetTheme);
});
