import { style, styleVariants, type StyleRule } from '@vanilla-extract/css';
import {
  darkSelector,
  lightSelector,
  systemSelector,
} from '@lib/design/color-scheme';
import type { ColorSchemeId } from '@lib/theme/constants';

const forcedSelectors: Record<ColorSchemeId, string> = {
  light: lightSelector,
  dark: darkSelector,
};

const opposite: Record<ColorSchemeId, ColorSchemeId> = {
  light: 'dark',
  dark: 'light',
};

// Hide an element unless its scheme is the one on screen, whether
// forced or inherited from the OS. Every rule only ever hides, so
// there's no `display` value to restore and the element keeps its own.
const hideUnless = (scheme: ColorSchemeId): StyleRule => ({
  selectors: {
    [`${forcedSelectors[opposite[scheme]]} &`]: { display: 'none' },
  },
  '@media': {
    [`(prefers-color-scheme: ${opposite[scheme]})`]: {
      selectors: { [`${systemSelector} &`]: { display: 'none' } },
    },
  },
});

/**
 * One class per scheme on screen, for the icon and label that go with
 * it. Exactly one of each is visible at a time, decided before
 * hydration by `<html data-color-scheme>` (stamped by the prelude) and
 * the OS preference.
 */
export const showing = styleVariants({
  light: hideUnless('light'),
  dark: hideUnless('dark'),
} satisfies Record<ColorSchemeId, unknown>);

/**
 * Hides the whole toggle without JS, where a click does nothing. `:root`
 * lifts the rule's specificity over the element's display class.
 */
export const toggle = style({
  '@media': {
    '(scripting: none)': {
      selectors: { ':root &': { display: 'none' } },
    },
  },
});
