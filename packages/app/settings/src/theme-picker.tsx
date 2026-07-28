import { For } from 'solid-js';
import { useRun, useValue } from '@lib/state-next';
import { RadioCardsItem, RadioCardsRoot } from '@lib/ui';
import { DEFAULT_THEME_ID, THEMES, type ThemeId } from '@lib/theme';
import {
  appearanceStore,
  resetThemeSaga,
  selectThemeSaga,
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
  const appearance = useValue(appearanceStore);
  const selectTheme = useRun(selectThemeSaga);

  return (
    <RadioCardsRoot
      testId="theme-picker"
      name="theme"
      value={appearance().theme}
      skeleton={appearance().theme === null}
      onValueChange={(next) => void selectTheme(next as ThemeId)}
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
 * while the theme is already default — or still unhydrated (`null`) —
 * matching the reset affordances in the Advanced section.
 */
export const ThemeResetButton = () => {
  const appearance = useValue(appearanceStore);
  const resetTheme = useRun(resetThemeSaga);

  return (
    <ResetButton
      testId="theme-picker-reset"
      label="Reset theme"
      disabled={
        appearance().theme === null || appearance().theme === DEFAULT_THEME_ID
      }
      onReset={() => void resetTheme()}
    />
  );
};
