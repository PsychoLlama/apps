import { For } from 'solid-js';
import { useAction } from '@lib/effects/solid';
import { Flex, IconButton, Tooltip } from '@lib/ui';
import {
  COLOR_SCHEME_IDS,
  type ColorSchemeId,
  type ColorSchemeOption,
} from '../constants';
import { $setAppearance } from '../effects/appearance';
import IconSun from 'virtual:icons/mdi/weather-sunny';
import IconMoon from 'virtual:icons/mdi/weather-night';
import * as css from './appearance-toggle.css';

const target = (showing: ColorSchemeId): ColorSchemeId =>
  showing === 'dark' ? 'light' : 'dark';

// Flip the visible scheme. Landing on the OS preference clears the
// override instead of pinning it, so the toggle never stores a value
// that matches the system. Read at click time, so the prerender never
// needs to know it.
const nextStep = (showing: ColorSchemeId): ColorSchemeOption => {
  const system = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  return target(showing) === system ? 'system' : target(showing);
};

// Names the scheme you'll see, even when the stored value becomes
// `'system'`. Close enough, and simpler than explaining the fallback.
const label = (showing: ColorSchemeId): string =>
  `Switch to ${target(showing)} theme`;

/**
 * Light/dark toggle. Flips whichever scheme is showing, falling back to
 * `'system'` when the flip lands on the OS preference. Pinning a scheme
 * that matches the OS is left to the settings page's `AppearancePicker`.
 *
 * One button per scheme is rendered up front, and CSS shows the one
 * that matches the screen. The right icon and label paint from the
 * prerender — no skeleton, no hydration flash.
 */
export const AppearanceToggle = () => {
  const setAppearance = useAction($setAppearance);
  const buttons: Partial<Record<ColorSchemeId, HTMLButtonElement>> = {};

  const flip = (showing: ColorSchemeId, button: HTMLButtonElement) => {
    const hadFocus = document.activeElement === button;
    setAppearance('colorScheme', nextStep(showing));

    // The flip hides this button and reveals its sibling, and focus on a
    // hidden element falls back to the page. Hand it over so keyboard
    // users can keep toggling. A mouse press that never focused the
    // button (Safari) is left alone.
    if (hadFocus) buttons[target(showing)]?.focus();
  };

  return (
    <For each={COLOR_SCHEME_IDS}>
      {(showing) => (
        // The tooltip wraps its trigger, so hiding the button alone would
        // leave an empty wrapper taking up a slot in the parent's layout.
        // The scheme class hides the whole thing instead.
        <Flex as="div" class={css.showing[showing]}>
          <Tooltip
            display="block"
            content={label(showing)}
            side="bottom"
            align="end"
            hoverable={false}
            testId={`appearance-toggle-${showing}-tooltip`}
          >
            {({ 'aria-describedby': labelId, ...trigger }) => (
              <IconButton
                {...trigger}
                // The tooltip is the name, so it labels rather than
                // describes.
                aria-labelledby={labelId}
                testId={`appearance-toggle-${showing}`}
                variant="ghost"
                color="neutral"
                ref={(button) => (buttons[showing] = button)}
                onClick={(event) => flip(showing, event.currentTarget)}
              >
                {/* The icon shows where a press goes, like the label. */}
                {target(showing) === 'dark' ? (
                  <IconMoon width="24" height="24" aria-hidden="true" />
                ) : (
                  <IconSun width="24" height="24" aria-hidden="true" />
                )}
              </IconButton>
            )}
          </Tooltip>
        </Flex>
      )}
    </For>
  );
};
