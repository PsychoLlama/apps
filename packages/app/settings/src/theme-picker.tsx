import { For, onMount } from 'solid-js';
import { useEffect } from '@lib/state';
import { RadioCardsItem, RadioCardsRoot } from '@lib/ui';
import { DEFAULT_THEME_ID, THEMES, type ThemeId } from '@lib/theme';
import {
  hydrateThemeEffect,
  resetThemeEffect,
  selectThemeEffect,
  theme,
} from '@lib/theme/runtime';
import { ResetButton } from './reset-button';
import * as css from './theme-picker.css';

/**
 * `id` of the heading the picker is labelled by. Shared between the
 * heading element and the radio group's `aria-labelledby` so the two
 * stay in sync.
 */
export const themeHeadingId = 'settings-theme-heading';

/**
 * Theme picker. Renders a `RadioCards` group with one card per built-in
 * theme. Reads/writes the active theme through `@lib/theme` — selecting
 * a card flips `<html data-theme>` and persists the choice to
 * localStorage.
 */
export const ThemePicker = () => {
  const selectTheme = useEffect(selectThemeEffect);
  const hydrateTheme = useEffect(hydrateThemeEffect);

  // The site is SSG'd, so the server can't know the persisted theme.
  // The store starts unhydrated (`id: null`); `onMount` reads the
  // prelude-stamped attribute and dispatches once the client takes
  // over. The radio group renders disabled with no card selected
  // until then, which beats flashing the wrong selection.
  onMount(hydrateTheme);

  return (
    <RadioCardsRoot
      testId="theme-picker"
      name="theme"
      value={theme.id}
      skeleton={theme.id === null}
      onValueChange={(next) => selectTheme(next as ThemeId)}
      gap={3}
      class={css.root}
      aria-labelledby={themeHeadingId}
    >
      <For each={THEMES}>
        {(entry) => (
          <RadioCardsItem
            testId={`theme-picker-${entry.id}`}
            value={entry.id}
            class={`${css.swatchBase} ${css.swatchTint[entry.id]}`}
          >
            {entry.label}
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
  );
};

/**
 * Inline action that snaps the theme back to `DEFAULT_THEME_ID`. Disabled
 * while the theme is already default — or still unhydrated (`id: null`) —
 * matching the reset affordances in the Advanced section.
 */
export const ThemeResetButton = () => {
  const resetTheme = useEffect(resetThemeEffect);

  return (
    <ResetButton
      testId="theme-picker-reset"
      label="Reset theme"
      disabled={theme.id === null || theme.id === DEFAULT_THEME_ID}
      onReset={() => resetTheme()}
    />
  );
};
