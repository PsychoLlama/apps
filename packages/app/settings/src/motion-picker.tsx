import { For, onMount, type Component, type JSX } from 'solid-js';
import { useEffect } from '@lib/state';
import { Flex, RadioCardsItem, RadioCardsRoot, Text } from '@lib/ui';
import type { MotionOption } from '@lib/theme';
import {
  hydrateMotionEffect,
  motion,
  selectMotionEffect,
} from '@lib/theme/runtime';
import IconMotionPlay from 'virtual:icons/mdi/motion-play-outline';
import IconMotionPause from 'virtual:icons/mdi/motion-pause-outline';
import IconAuto from 'virtual:icons/mdi/auto-mode';
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
  icon: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
}

const OPTIONS: ReadonlyArray<MotionPickerOption> = [
  { id: 'system', label: 'System', icon: IconAuto },
  { id: 'no-preference', label: 'Full', icon: IconMotionPlay },
  { id: 'reduce', label: 'Reduced', icon: IconMotionPause },
];

/**
 * Full/reduced/system picker for the `prefers-reduced-motion` overrides
 * in `@lib/design`. Reads/writes through `@lib/theme` — selecting a card
 * flips `<html data-reduced-motion>` (or drops it, for "System") and
 * persists the choice to localStorage.
 */
export const MotionPicker = () => {
  const selectMotion = useEffect(selectMotionEffect);
  const hydrateMotion = useEffect(hydrateMotionEffect);

  // Mirrors the AppearancePicker hydration pattern — the prelude is the
  // canonical pre-paint setter and the store learns what's already on
  // screen once the client mounts. The radio group renders disabled with
  // no card selected until then, which beats flashing the wrong
  // selection.
  onMount(hydrateMotion);

  return (
    <RadioCardsRoot
      testId="motion-picker"
      name="motion"
      value={motion.id}
      skeleton={motion.id === null}
      onValueChange={(next) => selectMotion(next as MotionOption)}
      gap={3}
      columns={3}
      aria-labelledby={motionHeadingId}
    >
      <For each={OPTIONS}>
        {(entry) => (
          <RadioCardsItem
            testId={`motion-picker-${entry.id}`}
            value={entry.id}
            class={css.card}
          >
            <Flex as="div" direction="row" align="center" gap={2}>
              <entry.icon aria-hidden="true" />
              <Text as="span" size={2} selectable={false}>
                {entry.label}
              </Text>
            </Flex>
          </RadioCardsItem>
        )}
      </For>
    </RadioCardsRoot>
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
