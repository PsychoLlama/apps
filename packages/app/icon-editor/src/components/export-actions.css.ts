import { style } from '@vanilla-extract/css';
import {
  accent,
  fast,
  fontWeight,
  neutral,
  radius,
  space,
  standard,
} from '@lib/design';

/** Two-segment radiogroup container for the format toggle. */
export const formatGroup = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: space[2],
});

/** Single segmented chip — text label, neutral border, accent active state. */
export const formatOption = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: space[2],
  paddingInline: space[2],
  borderRadius: radius[2],
  backgroundColor: 'transparent',
  border: `1px solid ${neutral.solid[5]}`,
  color: neutral.solid[11],
  fontFamily: 'inherit',
  fontWeight: fontWeight.medium,
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color, color',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
  ':hover': {
    backgroundColor: neutral.alpha[3],
  },
  ':focus-visible': {
    outline: 'none',
    borderColor: accent.solid[8],
    boxShadow: `0 0 0 2px ${accent.alpha[5]}`,
  },
});

export const formatOptionActive = style({
  borderColor: accent.solid[8],
  backgroundColor: accent.alpha[3],
  color: accent.solid[11],
});

/**
 * Footer row beneath the export button — surfaces the active pack's
 * license SPDX so the user sees what they're committing to. Quiet
 * styling so it reads as informational, not an action.
 */
export const licenseRow = style({
  paddingTop: space[1],
});
