import { For, Show, onMount } from 'solid-js';
import { useEffect } from '@lib/state';
import { Button, RadioCardsItem, RadioCardsRoot } from '@lib/ui';
import { DEFAULT_THEME_ID, THEMES, type ThemeId } from '@lib/theme';
import {
  hydrateThemeEffect,
  resetThemeEffect,
  selectThemeEffect,
  theme,
} from '@lib/theme/runtime';
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
 * Inline action that snaps the theme back to `DEFAULT_THEME_ID`. Renders
 * only when the user has made a non-default selection — keeps the
 * settings page free of always-on disabled affordances and stays hidden
 * during the pre-hydration skeleton state.
 */
export const ThemeResetButton = () => {
  const resetTheme = useEffect(resetThemeEffect);

  return (
    <Show when={theme.id !== null && theme.id !== DEFAULT_THEME_ID}>
      <Button
        testId="theme-picker-reset"
        variant="ghost"
        color="neutral"
        size={1}
        onClick={() => resetTheme()}
      >
        Restore default
      </Button>
    </Show>
  );
};
