import { For } from 'solid-js';
import { useAction } from '@lib/effects/solid';
import { IconButton } from '@lib/ui';
import type { ColorSchemeId, ColorSchemeOption } from '../constants';
import { $setAppearance } from '../effects/appearance';
import IconSun from 'virtual:icons/mdi/weather-sunny';
import IconMoon from 'virtual:icons/mdi/weather-night';
import * as css from './appearance-toggle.css';

interface Permutation {
  /** The stored override, or `'system'` for none. */
  configured: ColorSchemeOption;
  /** The OS preference. */
  system: ColorSchemeId;
}

const PERMUTATIONS: ReadonlyArray<Permutation> = (
  ['system', 'light', 'dark'] as const
).flatMap((configured) =>
  (['light', 'dark'] as const).map((system) => ({ configured, system })),
);

const effective = (state: Permutation): ColorSchemeId =>
  state.configured === 'system' ? state.system : state.configured;

// Flip the visible scheme. Landing on the OS preference clears the
// override instead of pinning it, so the toggle never stores a value
// that matches the system.
const nextStep = (state: Permutation): ColorSchemeOption => {
  const target = effective(state) === 'dark' ? 'light' : 'dark';
  return target === state.system ? 'system' : target;
};

const label = (state: Permutation): string => {
  const next = nextStep(state);
  return next === 'system'
    ? `Switch to system theme (${state.system})`
    : `Switch to ${next} theme`;
};

/**
 * Light/dark toggle. Flips whichever scheme is showing, falling back to
 * `'system'` when the flip lands on the OS preference. Pinning a scheme
 * that matches the OS is left to the settings page's `AppearancePicker`.
 *
 * Every permutation of stored override × OS preference is rendered up
 * front, and CSS shows the one that matches. The right icon and label
 * paint from the prerender — no skeleton, no hydration flash.
 */
export const AppearanceToggle = () => {
  const setAppearance = useAction($setAppearance);

  return (
    <For each={PERMUTATIONS}>
      {(state) => (
        <IconButton
          testId={`appearance-toggle-${state.configured}-${state.system}`}
          aria-label={label(state)}
          variant="ghost"
          color="neutral"
          class={css.permutation[`${state.configured}-${state.system}`]}
          onClick={() => setAppearance('colorScheme', nextStep(state))}
        >
          {effective(state) === 'dark' ? (
            <IconMoon width="24" height="24" aria-hidden="true" />
          ) : (
            <IconSun width="24" height="24" aria-hidden="true" />
          )}
        </IconButton>
      )}
    </For>
  );
};
