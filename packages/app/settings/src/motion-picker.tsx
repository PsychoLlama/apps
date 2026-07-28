import { For } from 'solid-js';
import { useRun, useValue } from '@lib/state';
import { SegmentedControlItem, SegmentedControlRoot } from '@lib/ui';
import type { MotionOption } from '@lib/theme';
import { appearanceStore, selectMotionSaga } from '@lib/theme/runtime';
import { ResetButton } from './reset-button';
import * as css from './motion-picker.css';

/**
 * `id` of the heading the picker is labelled by. Shared between the
 * heading element and the radio group's `aria-labelledby` so the two
 * stay in sync.
 */
export const motionHeadingId = 'settings-motion-heading';

interface MotionPickerOption {
  id: MotionOption;
  label: string;
}

// No icons. A three-segment track carrying icon + label overflows a
// 320px viewport, and the control can't shrink below `max-content`.
const OPTIONS: ReadonlyArray<MotionPickerOption> = [
  { id: 'system', label: 'System' },
  { id: 'no-preference', label: 'Full' },
  { id: 'reduce', label: 'Reduced' },
];

/**
 * Full/reduced/system picker for the `prefers-reduced-motion` overrides
 * in `@lib/design`. Reads/writes through `@lib/theme` — selecting a
 * segment flips `<html data-reduced-motion>` (or drops it, for "System")
 * and persists the choice to localStorage.
 */
export const MotionPicker = () => {
  const appearance = useValue(appearanceStore);
  const selectMotion = useRun(selectMotionSaga);

  return (
    <SegmentedControlRoot
      testId="motion-picker"
      name="motion"
      value={appearance().motion}
      skeleton={appearance().motion === null}
      onValueChange={(next) => void selectMotion(next as MotionOption)}
      class={css.control}
      aria-labelledby={motionHeadingId}
    >
      <For each={OPTIONS}>
        {(entry) => (
          <SegmentedControlItem
            testId={`motion-picker-${entry.id}`}
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
 * Inline action that hands motion back to `'system'` — the no-override
 * default that drops the persisted key and lets
 * `@media (prefers-reduced-motion)` take over. Disabled while already on
 * `'system'` — or still unhydrated (`null`) — matching the reset
 * affordances elsewhere on the settings page.
 */
export const MotionResetButton = () => {
  const appearance = useValue(appearanceStore);
  const selectMotion = useRun(selectMotionSaga);

  return (
    <ResetButton
      testId="motion-picker-reset"
      label="Reset motion"
      disabled={
        appearance().motion === null || appearance().motion === 'system'
      }
      onReset={() => void selectMotion('system')}
    />
  );
};
