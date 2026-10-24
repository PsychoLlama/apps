import { For } from 'solid-js';
import { Suspense, useAction, useClientResource } from '@lib/effects/solid';
import { SegmentedControlItem, SegmentedControlRoot } from '@lib/ui';
import type { MotionOption } from '@lib/theme';
import { $setPreferences } from '@lib/theme/effects';
import { $preferences } from '@lib/theme/state';
import { ResetButton } from './reset-button';
import { SettingsSection } from './settings-section';
import * as css from './motion-settings.css';

const headingId = 'settings-motion-heading';

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
 * The Motion section: full/reduced/system, driving the
 * `prefers-reduced-motion` overrides in `@lib/design`. Reads/writes
 * through `@lib/theme` — selecting a segment flips
 * `<html data-reduced-motion>` (or drops it, for "System") and persists
 * the choice to localStorage.
 */
export const MotionSettings = () => (
  <SettingsSection
    title="Motion"
    headingId={headingId}
    description="Controls animations and transitions."
    action={<ResetMotion />}
  >
    <MotionPicker />
  </SettingsSection>
);

const MotionPicker = () => {
  const preferences = useClientResource($preferences);
  const setPreferences = useAction($setPreferences);

  const picker = (skeleton: boolean) => (
    <SegmentedControlRoot
      testId="motion-picker"
      name="motion"
      value={skeleton ? null : (preferences()?.motion ?? null)}
      skeleton={skeleton}
      onValueChange={(next) => setPreferences('motion', next as MotionOption)}
      class={css.control}
      aria-labelledby={headingId}
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

// Hands motion back to `'system'` — the no-override default that drops
// the persisted key and lets `@media (prefers-reduced-motion)` take
// over. Disabled while already on `'system'`. Hidden until the
// preference is read off `<html>`, like the log filter's reset.
const ResetMotion = () => {
  const preferences = useClientResource($preferences);
  const setPreferences = useAction($setPreferences);

  return (
    <Suspense>
      <ResetButton
        testId="motion-picker-reset"
        label="Reset motion"
        disabled={preferences()?.motion === 'system'}
        onReset={() => setPreferences('motion', 'system')}
      />
    </Suspense>
  );
};
