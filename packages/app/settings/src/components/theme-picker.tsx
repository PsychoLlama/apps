import { For } from 'solid-js';
import clx from '@lib/classnames';
import { Suspense, useAction, useClientResource } from '@lib/effects/solid';
import { RadioCardsItem, RadioCardsRoot } from '@lib/ui';
import { DEFAULT_THEME_ID, THEMES, type ThemeId } from '@lib/theme';
import { $resetTheme, $selectTheme, $theme } from '@lib/theme/runtime';
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
  const theme = useClientResource($theme);
  const selectTheme = useAction($selectTheme);

  const picker = (skeleton: boolean) => (
    <RadioCardsRoot
      testId="theme-picker"
      name="theme"
      value={skeleton ? null : (theme() ?? null)}
      skeleton={skeleton}
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
            class={clx(css.swatchBase, css.swatchTint[entry.id])}
          >
            {entry.label}
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
  );

  // The server can't know the persisted preference. A skeleton beats
  // flashing the wrong selection.
  return <Suspense fallback={picker(true)}>{picker(false)}</Suspense>;
};

/**
 * Inline action that snaps the theme back to `DEFAULT_THEME_ID`. Disabled
 * while the theme is already default. Hidden until the preference is read
 * off `<html>`, like the other resets on the page.
 */
export const ThemeResetButton = () => {
  const theme = useClientResource($theme);
  const resetTheme = useAction($resetTheme);

  return (
    <Suspense>
      <ResetButton
        testId="theme-picker-reset"
        label="Reset theme"
        disabled={theme() === DEFAULT_THEME_ID}
        onReset={resetTheme}
      />
    </Suspense>
  );
};
