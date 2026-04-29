/**
 * Margin primitives. The system is two-layered so that variants which
 * need to derive their effective margin from the user-supplied value
 * (e.g. ghost-variant buttons subtract their padding) can compose with
 * the user prop instead of replacing it outright.
 *
 * Layering:
 * - User margin classes (`m`/`mx`/`my`) set `--user-margin-{side}`.
 * - `marginBase` defaults the user vars to `0px` and applies
 *   `var(--margin-{side}-override, var(--user-margin-{side}))` as the
 *   element's actual margin — the override wins when present, the user
 *   var wins when not.
 * - A variant that wants to compose (ghost button) SETS
 *   `--margin-{side}-override` to a `calc(user - padding)` expression.
 * - Resetting `--margin-{side}-override: initial` on direct children
 *   takes the override back to "unset" so the child's own user var
 *   takes over again.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/styles/utilities/margin.css
 */

import {
  createVar,
  fallbackVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import { space } from '@lib/design';

export const userMarginTop = createVar();
export const userMarginRight = createVar();
export const userMarginBottom = createVar();
export const userMarginLeft = createVar();

export const marginTopOverride = createVar();
export const marginRightOverride = createVar();
export const marginBottomOverride = createVar();
export const marginLeftOverride = createVar();

/**
 * Default base applied to every element accepting `MarginProps`.
 * Defaults the user vars locally so an ancestor's user-margin doesn't
 * cascade into descendants.
 */
export const marginBase = style({
  vars: {
    [userMarginTop]: '0px',
    [userMarginRight]: '0px',
    [userMarginBottom]: '0px',
    [userMarginLeft]: '0px',
  },
  marginTop: fallbackVar(marginTopOverride, userMarginTop),
  marginRight: fallbackVar(marginRightOverride, userMarginRight),
  marginBottom: fallbackVar(marginBottomOverride, userMarginBottom),
  marginLeft: fallbackVar(marginLeftOverride, userMarginLeft),
});

export const margin = styleVariants(space, (value) => ({
  vars: {
    [userMarginTop]: value,
    [userMarginRight]: value,
    [userMarginBottom]: value,
    [userMarginLeft]: value,
  },
}));

export const marginX = styleVariants(space, (value) => ({
  vars: {
    [userMarginRight]: value,
    [userMarginLeft]: value,
  },
}));

export const marginY = styleVariants(space, (value) => ({
  vars: {
    [userMarginTop]: value,
    [userMarginBottom]: value,
  },
}));
