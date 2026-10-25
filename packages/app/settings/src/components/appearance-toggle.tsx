import { useAction, useClientValue } from '@lib/effects/solid';
import { Flex, IconButton, Text, Tooltip } from '@lib/ui';
import type { ColorSchemeId, ColorSchemeOption } from '@lib/theme/constants';
import {
  $appearance,
  $setAppearance,
  $systemColorScheme,
} from '@lib/theme/behavior';
import IconSun from 'virtual:icons/mdi/weather-sunny';
import IconMoon from 'virtual:icons/mdi/weather-night';
import * as css from './appearance-toggle.css';

const target = (showing: ColorSchemeId): ColorSchemeId =>
  showing === 'dark' ? 'light' : 'dark';

// Flip the visible scheme. Landing on the OS preference clears the
// override instead of pinning it, so the toggle never stores a value
// that matches the system.
const nextStep = (
  showing: ColorSchemeId,
  system: ColorSchemeId,
): ColorSchemeOption =>
  target(showing) === system ? 'system' : target(showing);

// Names the scheme you'll see, even when the stored value becomes
// `'system'`. Close enough, and simpler than explaining the fallback.
const label = (showing: ColorSchemeId): string =>
  `Switch to ${target(showing)} theme`;

/**
 * Light/dark toggle. Flips whichever scheme is showing, falling back to
 * `'system'` when the flip lands on the OS preference. Pinning a scheme
 * that matches the OS is left to the settings page's `AppearancePicker`.
 *
 * The label and icon render for both schemes up front, and CSS shows
 * the pair that matches the screen. They paint right from the
 * prerender — no skeleton, no hydration flash.
 */
export const AppearanceToggle = () => {
  const setAppearance = useAction($setAppearance);
  const appearance = useClientValue($appearance);
  const systemColorScheme = useClientValue($systemColorScheme);

  // The scheme on screen, once both settle on mount.
  const showing = (): ColorSchemeId | undefined => {
    const system = systemColorScheme();
    const forced = appearance();
    if (system === undefined || forced === undefined) return undefined;

    return forced === 'system' ? system : forced;
  };

  // Settles ahead of any press. Light is what CSS assumes without a
  // preference.
  const flip = () =>
    setAppearance(
      nextStep(showing() ?? 'light', systemColorScheme() ?? 'light'),
    );

  // A hidden tooltip lends the button its whole text, hidden half
  // included, so name the half on screen outright. Until mount a press
  // does nothing, and the name says no more than that.
  const name = () => {
    const current = showing();
    return current === undefined ? 'Switch theme' : label(current);
  };

  return (
    // The tooltip wraps its trigger, so hiding the button alone would
    // leave an empty wrapper taking up a slot in the parent's layout.
    <Flex as="div" class={css.toggle}>
      <Tooltip
        display="block"
        content={
          <>
            <Text as="span" selectable={false} class={css.showing.light}>
              {label('light')}
            </Text>
            <Text as="span" selectable={false} class={css.showing.dark}>
              {label('dark')}
            </Text>
          </>
        }
        aria-label={name()}
        side="bottom"
        align="end"
        hoverable={false}
        testId="appearance-toggle-tooltip"
      >
        {({ 'aria-describedby': labelId, ...trigger }) => (
          <IconButton
            {...trigger}
            // The tooltip is the name, so it labels rather than
            // describes.
            aria-labelledby={labelId}
            testId="appearance-toggle"
            variant="ghost"
            color="neutral"
            onClick={flip}
          >
            {/* The icon shows where a press goes, like the label. */}
            <IconMoon
              class={css.showing.light}
              width="24"
              height="24"
              aria-hidden="true"
            />
            <IconSun
              class={css.showing.dark}
              width="24"
              height="24"
              aria-hidden="true"
            />
          </IconButton>
        )}
      </Tooltip>
    </Flex>
  );
};
