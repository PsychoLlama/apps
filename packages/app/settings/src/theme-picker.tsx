import { For } from 'solid-js';
import { useAction } from '@lib/state';
import { RadioCardsItem, RadioCardsRoot } from '@lib/ui';
import { setThemeAction, theme } from '@lib/theme';
import { THEMES, type ThemeId } from '@lib/theme/catalog';
import * as css from './theme-picker.css';

/**
 * `id` of the heading the picker is labelled by. Shared between the
 * heading element and the radio group's `aria-labelledby` so the two
 * stay in sync.
 */
export const themeHeadingId = 'settings-theme-heading';

/**
 * Theme picker. Renders a `RadioCards` group with one card per
 * built-in theme and dispatches the shared `setThemeAction` on
 * change — the active theme drives `<ThemeStylesheet>`'s `href`,
 * so swapping the selection live-swaps the stylesheet.
 */
export const ThemePicker = () => {
  const setTheme = useAction(setThemeAction);

  return (
    <RadioCardsRoot
      testId="theme-picker"
      name="theme"
      value={theme.id}
      onValueChange={(next) => setTheme(next as ThemeId)}
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
