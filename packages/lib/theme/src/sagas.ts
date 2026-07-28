import { call, commit, defineSaga } from '@lib/state-next';
import {
  applyColorScheme,
  applyMotion,
  applyTheme,
  readActiveAppearance,
  resetTheme,
} from './capabilities';
import type { ColorSchemeOption, MotionOption, ThemeId } from './constants';
import { appearanceScope } from './scope';
import {
  appearanceRestoredTopic,
  colorSchemeSelectedTopic,
  motionSelectedTopic,
  themeResetTopic,
  themeSelectedTopic,
} from './appearance';

/**
 * Mirror the prelude-stamped `<html>` attributes into the store. Run once
 * per surface on mount — the prelude is the canonical pre-paint setter, so
 * the store just learns what's already on screen.
 *
 * All three preferences hydrate together in a single transition. Reading
 * them is three dataset lookups, and one commit means a picker set can't
 * render with some controls live and others still skeletons.
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

/**
 * Switch the active color-scheme override. Commits first so the UI reacts
 * synchronously, then flips `<html data-color-scheme>` (or drops it, for
 * `'system'`) and updates localStorage so the prelude can restore the
 * choice before paint on the next load.
 */
export const selectColorSchemeSaga = defineSaga(
  appearanceScope,
  async function* (option: ColorSchemeOption) {
    yield commit(colorSchemeSelectedTopic(option));
    yield* call(applyColorScheme, option);
  },
);

/**
 * Switch the active motion override. Commits first so the UI reacts
 * synchronously, then flips `<html data-reduced-motion>` (or drops it, for
 * `'system'`) and updates localStorage so the prelude can restore the
 * choice before paint on the next load.
 */
export const selectMotionSaga = defineSaga(
  appearanceScope,
  async function* (option: MotionOption) {
    yield commit(motionSelectedTopic(option));
    yield* call(applyMotion, option);
  },
);
