import { For } from 'solid-js';
import { Suspense, useAction, useClientResource } from '@lib/effects/solid';
import { SegmentedControlItem, SegmentedControlRoot } from '@lib/ui';
import type { ColorSchemeOption } from '@lib/theme';
import { $setAppearance } from '@lib/theme/effects';
import { $appearance } from '@lib/theme/state';
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
  const appearance = useClientResource($appearance);
  const setAppearance = useAction($setAppearance);

  const picker = (skeleton: boolean) => (
    <SegmentedControlRoot
      testId="appearance-picker"
      name="appearance"
      value={skeleton ? null : (appearance()?.colorScheme ?? null)}
      skeleton={skeleton}
      onValueChange={(next) =>
        setAppearance('colorScheme', next as ColorSchemeOption)
      }
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

  // The server can't know the persisted preference. A skeleton beats
  // flashing the wrong selection.
  return <Suspense fallback={picker(true)}>{picker(false)}</Suspense>;
};

/**
 * Inline action that hands the color scheme back to `'system'` — the
 * no-override default that drops the persisted key and lets
 * `@media (prefers-color-scheme)` take over. Disabled while already on
 * `'system'`. Hidden until the preference is read off `<html>`, like the
 * log filter's reset.
 */
export const AppearanceResetButton = () => {
  const appearance = useClientResource($appearance);
  const setAppearance = useAction($setAppearance);

  return (
    <Suspense>
      <ResetButton
        testId="appearance-picker-reset"
        label="Reset appearance"
        disabled={appearance()?.colorScheme === 'system'}
        onReset={() => setAppearance('colorScheme', 'system')}
      />
    </Suspense>
  );
};
