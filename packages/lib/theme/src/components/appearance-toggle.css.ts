import { styleVariants } from '@vanilla-extract/css';
import {
  darkSelector,
  lightSelector,
  systemSelector,
} from '@lib/design/color-scheme';
import type { ColorSchemeId, ColorSchemeOption } from '../constants';

const configuredSelectors: Record<ColorSchemeOption, string> = {
  system: systemSelector,
  light: lightSelector,
  dark: darkSelector,
};

const opposite: Record<ColorSchemeId, ColorSchemeId> = {
  light: 'dark',
  dark: 'light',
};

/** Key for one permutation: `<configured>-<system>`. */
type PermutationKey = `${ColorSchemeOption}-${ColorSchemeId}`;

// Hide a permutation unless both the configured scheme and the OS scheme
// match it. Every rule only ever hides, so there's no `display` value to
// restore and the button keeps its own. `:root` lifts the media rule's
// specificity over the button's display class.
const hideUnless = (configured: ColorSchemeOption, system: ColorSchemeId) => {
  const otherConfigured = (
    Object.keys(configuredSelectors) as ColorSchemeOption[]
  ).filter((key) => key !== configured);

  return {
    selectors: Object.fromEntries(
      otherConfigured.map((key) => [
        `${configuredSelectors[key]} &`,
        { display: 'none' },
      ]),
    ),
    '@media': {
      [`(prefers-color-scheme: ${opposite[system]})`]: {
        selectors: { ':root &': { display: 'none' } },
      },
    },
  };
};

/**
 * One class per permutation. Exactly one toggle is visible at a time,
 * decided before hydration by `<html data-color-scheme>` (stamped by the
 * prelude) and the OS preference.
 */
export const permutation = styleVariants({
  'system-light': hideUnless('system', 'light'),
  'system-dark': hideUnless('system', 'dark'),
  'light-light': hideUnless('light', 'light'),
  'light-dark': hideUnless('light', 'dark'),
  'dark-light': hideUnless('dark', 'light'),
  'dark-dark': hideUnless('dark', 'dark'),
} satisfies Record<PermutationKey, unknown>);
