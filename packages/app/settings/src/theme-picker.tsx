import { For } from 'solid-js';
import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import { RadioCardsItem, RadioCardsRoot } from '@lib/ui';
import { DEFAULT_THEME_ID, THEMES, type ThemeId } from '@lib/theme';
import * as css from './theme-picker.css';

/**
 * `id` of the heading the picker is labelled by. Shared between the
 * heading element and the radio group's `aria-labelledby` so the two
 * stay in sync.
 */
export const themeHeadingId = 'settings-theme-heading';

// Local-only: the picker's selection isn't observed by anything else
// yet. When live theme switching gets wired up, lift this store into
// a shared location and replace `DEFAULT_THEME_ID` with the source
// of truth.
const pickerStore = defineStore<{ id: ThemeId }>(() => ({
  id: DEFAULT_THEME_ID,
}));
const picker = createStore(pickerStore);
const setPickerThemeAction = defineAction(
  [pickerStore],
  (state, next: ThemeId) => {
    state.id = next;
  },
);

/**
 * Theme picker. Renders a `RadioCards` group with one card per
 * built-in theme. The selection is held in a local store — there's
 * no shared theme state yet, so the picker reflects the user's
 * choice visually but doesn't drive the active theme. See the
 * callout above in the settings page.
 */
export const ThemePicker = () => {
  const setSelected = useAction(setPickerThemeAction);

  return (
    <RadioCardsRoot
      testId="theme-picker"
      name="theme"
      value={picker.id}
      onValueChange={(next) => setSelected(next as ThemeId)}
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
