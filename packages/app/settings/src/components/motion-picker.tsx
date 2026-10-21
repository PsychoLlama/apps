import { For } from 'solid-js';
import { Suspense, useAction, useClientResource } from '@lib/effects/solid';
import { SegmentedControlItem, SegmentedControlRoot } from '@lib/ui';
import type { MotionOption } from '@lib/theme';
import { $setAppearance } from '@lib/theme/effects';
import { $appearance } from '@lib/theme/state';
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
  const appearance = useClientResource($appearance);
  const setAppearance = useAction($setAppearance);

  const picker = (skeleton: boolean) => (
    <SegmentedControlRoot
      testId="motion-picker"
      name="motion"
      value={skeleton ? null : (appearance()?.motion ?? null)}
      skeleton={skeleton}
      onValueChange={(next) => setAppearance('motion', next as MotionOption)}
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

  // The server can't know the persisted preference. A skeleton beats
  // flashing the wrong selection.
  return <Suspense fallback={picker(true)}>{picker(false)}</Suspense>;
};

/**
 * Inline action that hands motion back to `'system'` — the no-override
 * default that drops the persisted key and lets
 * `@media (prefers-reduced-motion)` take over. Disabled while already on
 * `'system'`. Hidden until the preference is read off `<html>`, like the
 * log filter's reset.
 */
export const MotionResetButton = () => {
  const appearance = useClientResource($appearance);
  const setAppearance = useAction($setAppearance);

  return (
    <Suspense>
      <ResetButton
        testId="motion-picker-reset"
        label="Reset motion"
        disabled={appearance()?.motion === 'system'}
        onReset={() => setAppearance('motion', 'system')}
      />
    </Suspense>
  );
};
