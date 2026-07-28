import { call, commit, defineSaga } from '@lib/state-next';
import {
  applyColorScheme,
  applyMotion,
  applyTheme,
  readActiveColorScheme,
  readActiveMotion,
  readActiveTheme,
  resetTheme,
} from './capabilities';
import type { ColorSchemeOption, MotionOption, ThemeId } from './constants';
import { themeScope } from './scope';
import {
  colorSchemeRestoredTopic,
  colorSchemeSelectedTopic,
  motionRestoredTopic,
  motionSelectedTopic,
  themeResetTopic,
  themeRestoredTopic,
  themeSelectedTopic,
} from './store';

/**
 * Mirror the prelude-stamped `<html data-theme>` value into the store.
 * Run once on mount — the prelude is the canonical pre-paint setter, so
 * the store just learns what's already on screen.
 */
export const hydrateThemeSaga = defineSaga(themeScope, async function* () {
  const id = yield* call(readActiveTheme);
  yield commit(themeRestoredTopic(id));
});

/**
 * Switch the active theme. Commits first so the UI reacts synchronously,
 * then flips `<html data-theme>` and persists the choice via localStorage
 * so it survives reload.
 */
export const selectThemeSaga = defineSaga(
  themeScope,
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
export const resetThemeSaga = defineSaga(themeScope, async function* () {
  yield commit(themeResetTopic());
  yield* call(resetTheme);
});

/**
 * Mirror the prelude-stamped `<html data-color-scheme>` value into the
 * store. Run once on mount, for the same reason as
 * {@link hydrateThemeSaga}.
 */
export const hydrateColorSchemeSaga = defineSaga(
  themeScope,
  async function* () {
    const id = yield* call(readActiveColorScheme);
    yield commit(colorSchemeRestoredTopic(id));
  },
);

/**
 * Switch the active color-scheme override. Commits first so the UI reacts
 * synchronously, then flips `<html data-color-scheme>` (or drops it, for
 * `'system'`) and updates localStorage so the prelude can restore the
 * choice before paint on the next load.
 */
export const selectColorSchemeSaga = defineSaga(
  themeScope,
  async function* (option: ColorSchemeOption) {
    yield commit(colorSchemeSelectedTopic(option));
    yield* call(applyColorScheme, option);
  },
);

/**
 * Mirror the prelude-stamped `<html data-reduced-motion>` value into the
 * store. Run once on mount, for the same reason as
 * {@link hydrateThemeSaga}.
 */
export const hydrateMotionSaga = defineSaga(themeScope, async function* () {
  const id = yield* call(readActiveMotion);
  yield commit(motionRestoredTopic(id));
});

/**
 * Switch the active motion override. Commits first so the UI reacts
 * synchronously, then flips `<html data-reduced-motion>` (or drops it, for
 * `'system'`) and updates localStorage so the prelude can restore the
 * choice before paint on the next load.
 */
export const selectMotionSaga = defineSaga(
  themeScope,
  async function* (option: MotionOption) {
    yield commit(motionSelectedTopic(option));
    yield* call(applyMotion, option);
  },
);
