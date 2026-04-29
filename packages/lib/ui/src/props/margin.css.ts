/**
 * Margin primitives. The system is additive so that variants which
 * need to retract from the user-supplied margin (e.g. ghost-variant
 * buttons compensate for their padding) can compose with the user prop
 * instead of replacing it outright.
 *
 * Layering:
 * - User margin classes (`m`/`mx`/`my`) set `--user-margin-{axis}`.
 * - A variant that wants to compose (ghost button) sets
 *   `--margin-{axis}-offset` to the amount to subtract.
 * - `marginBase` defaults both vars to `0px` and applies
 *   `margin-{axis}: calc(--user-margin-{axis} − --margin-{axis}-offset)`.
 *
 * `marginBase` re-declares both vars locally on every margin-aware
 * element, so a parent's user margin or offset never cascades into
 * descendants — each element starts from `0px`/`0px` and only its own
 * classes contribute.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/styles/utilities/margin.css
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';

export const userMarginBlock = createVar();
export const userMarginInline = createVar();

/**
 * Per-axis amount a variant wants subtracted from the user's margin.
 * Defaults to `0px` (no offset). The ghost button sets these to its
 * own padding so the layout box retracts to the content edge.
 */
export const marginBlockOffset = createVar();
export const marginInlineOffset = createVar();

/**
 * Default base applied to every element accepting `MarginProps`.
 * Re-declares both var groups locally so an ancestor's value never
 * cascades into descendants.
 */
export const marginBase = style({
  vars: {
    [userMarginBlock]: '0px',
    [userMarginInline]: '0px',
    [marginBlockOffset]: '0px',
    [marginInlineOffset]: '0px',
  },
  marginBlock: `calc(${userMarginBlock} - ${marginBlockOffset})`,
  marginInline: `calc(${userMarginInline} - ${marginInlineOffset})`,
});

export const margin = styleVariants(space, (value) => ({
  vars: {
    [userMarginBlock]: value,
    [userMarginInline]: value,
  },
}));

export const marginX = styleVariants(space, (value) => ({
  vars: { [userMarginInline]: value },
}));

export const marginY = styleVariants(space, (value) => ({
  vars: { [userMarginBlock]: value },
}));
