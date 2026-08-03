import { For } from 'solid-js';
import { useRun, useValue } from '@lib/state';
import { SegmentedControlItem, SegmentedControlRoot } from '@lib/ui';
import type { ColorSchemeOption } from '@lib/theme';
import { appearanceStore, selectColorSchemeSaga } from '@lib/theme/runtime';
import { ResetButton } from './reset-button';
import * as css from './appearance-picker.css';

/**
 * `id` of the heading the picker is labelled by. Shared between the
 * heading element and the radio group's `aria-labelledby` so the two
 * stay in sync.
 */
export const appearanceHeadingId = 'settings-appearance-heading';

interface AppearanceOption {
  id: ColorSchemeOption;
  label: string;
}

// No icons. A three-segment track carrying icon + label overflows a
// 320px viewport, and the control can't shrink below `max-content`.
const OPTIONS: ReadonlyArray<AppearanceOption> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

/**
 * Light/dark/system picker. Reads/writes through `@lib/theme` — selecting
 * a segment flips `<html data-color-scheme>` (or drops it, for "System")
 * and persists the choice to localStorage.
 */
export const AppearancePicker = () => {
  const appearance = useValue(appearanceStore);
  const selectScheme = useRun(selectColorSchemeSaga);

  return (
    <SegmentedControlRoot
      testId="appearance-picker"
      name="appearance"
      value={appearance().colorScheme}
      skeleton={appearance().colorScheme === null}
      onValueChange={(next) => void selectScheme(next as ColorSchemeOption)}
      class={css.control}
      aria-labelledby={appearanceHeadingId}
    >
      <For each={OPTIONS}>
        {(entry) => (
          <SegmentedControlItem
            testId={`appearance-picker-${entry.id}`}
            value={entry.id}
          >
            {entry.label}
          </SegmentedControlItem>
        )}
      </For>
    </SegmentedControlRoot>
  );
};

/**
 * Inline action that hands the color scheme back to `'system'` — the
 * no-override default that drops the persisted key and lets
 * `@media (prefers-color-scheme)` take over. Disabled while already on
 * `'system'` — or still unhydrated (`null`) — matching the reset
 * affordances elsewhere on the settings page.
 */
export const AppearanceResetButton = () => {
  const appearance = useValue(appearanceStore);
  const selectScheme = useRun(selectColorSchemeSaga);

  return (
    <ResetButton
      testId="appearance-picker-reset"
      label="Reset appearance"
      disabled={
        appearance().colorScheme === null ||
        appearance().colorScheme === 'system'
      }
      onReset={() => void selectScheme('system')}
    />
  );
};
