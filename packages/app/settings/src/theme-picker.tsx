import { For } from 'solid-js';
import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import { RadioCardsItem, RadioCardsRoot, Text } from '@lib/ui';
import { THEMES, type ThemeId } from '@lib/theme/catalog';
import * as css from './theme-picker.css';

interface ThemePickerState {
  selected: ThemeId;
}

const themePickerStore = defineStore<ThemePickerState>(() => ({
  selected: 'blue',
}));

/** Materialized view of the picker's local selection. */
export const themePicker = createStore(themePickerStore);

const selectThemeAction = defineAction(
  [themePickerStore],
  (state, next: ThemeId) => {
    state.selected = next;
  },
);

/**
 * Theme picker. Renders a `RadioCards` group with one card per
 * built-in theme. Selection lives in a local store; persistence and
 * dynamic bundle loading land in a follow-up.
 */
export const ThemePicker = () => {
  const selectTheme = useAction(selectThemeAction);

  return (
    <RadioCardsRoot
      testId="theme-picker"
      name="theme"
      value={themePicker.selected}
      onValueChange={(next) => selectTheme(next as ThemeId)}
      columns={2}
      gap={3}
    >
      <For each={THEMES}>
        {(theme) => (
          <RadioCardsItem
            testId={`theme-picker-${theme.id}`}
            value={theme.id}
            class={`${css.swatchBase} ${css.swatchTint[theme.id]}`}
          >
            <Text as="span" size={2} weight="medium" selectable={false}>
              {theme.label}
            </Text>
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
  );
};
