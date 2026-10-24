import { styleVariants, type StyleRule } from '@vanilla-extract/css';
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

// Hide a toggle unless its scheme is the one on screen, whether forced
// or inherited from the OS, and hide both without JS, where a click
// does nothing. Every rule only ever hides, so there's no `display`
// value to restore and the button keeps its own. `:root` lifts the
// no-JS rule's specificity over the button's display class.
const hideUnless = (scheme: ColorSchemeId): StyleRule => ({
  selectors: {
    [`${forcedSelectors[opposite[scheme]]} &`]: { display: 'none' },
  },
  '@media': {
    [`(prefers-color-scheme: ${opposite[scheme]})`]: {
      selectors: { [`${systemSelector} &`]: { display: 'none' } },
    },
    '(scripting: none)': {
      selectors: { ':root &': { display: 'none' } },
    },
  },
});

/**
 * One class per scheme on screen. Exactly one toggle is visible at a
 * time, decided before hydration by `<html data-color-scheme>` (stamped
 * by the prelude) and the OS preference.
 */
export const showing = styleVariants({
  light: hideUnless('light'),
  dark: hideUnless('dark'),
} satisfies Record<ColorSchemeId, unknown>);
