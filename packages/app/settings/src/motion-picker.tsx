import { For, onMount } from 'solid-js';
import { useEffect } from '@lib/state';
import { SegmentedControlItem, SegmentedControlRoot } from '@lib/ui';
import type { MotionOption } from '@lib/theme';
import {
  hydrateMotionEffect,
  motion,
  selectMotionEffect,
} from '@lib/theme/runtime';
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
  const selectMotion = useEffect(selectMotionEffect);
  const hydrateMotion = useEffect(hydrateMotionEffect);

  // Mirrors the AppearancePicker hydration pattern — the prelude is the
  // canonical pre-paint setter and the store learns what's already on
  // screen once the client mounts. The control renders disabled with no
  // segment selected until then, which beats flashing the wrong
  // selection.
  onMount(hydrateMotion);

  return (
    <SegmentedControlRoot
      testId="motion-picker"
      name="motion"
      value={motion.id}
      skeleton={motion.id === null}
      onValueChange={(next) => selectMotion(next as MotionOption)}
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
 * `'system'` — or still unhydrated (`id: null`) — matching the reset
 * affordances elsewhere on the settings page.
 */
export const MotionResetButton = () => {
  const selectMotion = useEffect(selectMotionEffect);

  return (
    <ResetButton
      testId="motion-picker-reset"
      label="Reset motion"
      disabled={motion.id === null || motion.id === 'system'}
      onReset={() => selectMotion('system')}
    />
  );
};
