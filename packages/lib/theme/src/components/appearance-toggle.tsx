import { For } from 'solid-js';
import { useAction } from '@lib/effects/solid';
import { Flex, IconButton, Tooltip } from '@lib/ui';
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

const target = (state: Permutation): ColorSchemeId =>
  effective(state) === 'dark' ? 'light' : 'dark';

// Flip the visible scheme. Landing on the OS preference clears the
// override instead of pinning it, so the toggle never stores a value
// that matches the system.
const nextStep = (state: Permutation): ColorSchemeOption =>
  target(state) === state.system ? 'system' : target(state);

// Names the scheme you'll see, even when the stored value becomes
// `'system'`. Close enough, and simpler than explaining the fallback.
const label = (state: Permutation): string =>
  `Switch to ${target(state)} theme`;

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
  const buttons: HTMLButtonElement[] = [];

  const flip = (state: Permutation, button: HTMLButtonElement) => {
    const hadFocus = document.activeElement === button;
    setAppearance('colorScheme', nextStep(state));

    // The flip hides this button and reveals a sibling, and focus on a
    // hidden element falls back to the page. Hand it over so keyboard
    // users can keep toggling. A mouse press that never focused the
    // button (Safari) is left alone.
    if (hadFocus) buttons.find((other) => other.checkVisibility())?.focus();
  };

  return (
    <For each={PERMUTATIONS}>
      {(state) => {
        const key = `${state.configured}-${state.system}` as const;

        // The tooltip wraps its trigger, so hiding the button alone would
        // leave an empty wrapper taking up a slot in the parent's layout.
        // The permutation class hides the whole thing instead.
        return (
          <Flex as="div" class={css.permutation[key]}>
            <Tooltip
              display="block"
              content={label(state)}
              side="bottom"
              align="end"
              hoverable={false}
              testId={`appearance-toggle-${key}-tooltip`}
            >
              {({ 'aria-describedby': labelId, ...trigger }) => (
                <IconButton
                  {...trigger}
                  // The tooltip is the name, so it labels rather than
                  // describes.
                  aria-labelledby={labelId}
                  testId={`appearance-toggle-${key}`}
                  variant="ghost"
                  color="neutral"
                  ref={(button) => buttons.push(button)}
                  onClick={(event) => flip(state, event.currentTarget)}
                >
                  {/* The icon shows where a press goes, like the label. */}
                  {target(state) === 'dark' ? (
                    <IconMoon width="24" height="24" aria-hidden="true" />
                  ) : (
                    <IconSun width="24" height="24" aria-hidden="true" />
                  )}
                </IconButton>
              )}
            </Tooltip>
          </Flex>
        );
      }}
    </For>
  );
};
