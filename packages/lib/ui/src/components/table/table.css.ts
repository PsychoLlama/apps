/**
 * Table styles.
 *
 * Ported from Radix UI Themes Table. Deviations:
 * - `size`, `variant`, `layout`, row `align`, and cell `justify` are
 *   static classes — no responsive `data-*` cascade.
 * - Row dividers are drawn with an `inset 0 -1px` shadow on each cell;
 *   the surface variant suppresses the shadow on the last body row by
 *   re-declaring the row's CSS var, which cascades into the cells.
 * - Surface variant uses `panelTranslucent` directly. We don't reach for
 *   the `color-mix()` half-transparent border tweak Radix uses since
 *   `neutral.alpha[6]` already blends through the panel.
 *
 * @see https://www.radix-ui.com/themes/docs/components/table
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  background,
  fontFamily,
  fontWeight,
  neutral,
  radius,
  space,
  typeScale,
  type TypeScale,
} from '@lib/design';

const cellPadding = createVar();
const cellMinHeight = createVar();
const tableBorderRadius = createVar();
const rowBackground = createVar();
const rowDivider = createVar();

// --- Root wrapper ---

export const root = style({
  vars: {
    // Defaults so the cell base always has a value, even before the
    // size variant lands. Mirror size-2.
    [cellPadding]: space[3],
    [cellMinHeight]: space[7],
    [tableBorderRadius]: radius[4],
    [rowBackground]: 'transparent',
    [rowDivider]: `inset 0 -1px ${neutral.alpha[5]}`,
  },
  // Inherit the row text color so children render against the panel.
  color: neutral.solid[12],
});

// --- Variant ---

const surfaceVariant = style({
  boxSizing: 'border-box',
  border: `1px solid ${neutral.alpha[6]}`,
  borderRadius: tableBorderRadius,
  backgroundColor: background.panelTranslucent,
  backgroundClip: 'padding-box',
  position: 'relative',
});

const ghostVariant = style({});

export const variant = {
  surface: surfaceVariant,
  ghost: ghostVariant,
};

// --- Table element ---

export const table = style({
  width: '100%',
  textAlign: 'start',
  verticalAlign: 'top',
  borderCollapse: 'collapse',
  borderSpacing: 0,
  boxSizing: 'border-box',
  fontFamily: fontFamily.body,
  fontWeight: fontWeight.regular,
  // Lets cell `height: 100%` work — needed when consumers stretch
  // interactive content across the full row.
  height: 0,
  selectors: {
    // Inside the surface wrapper, clip the table's outer corners so the
    // header tint and row dividers don't peek past the rounded edge.
    // The wrapper border eats one pixel; pull the inner radius in to
    // compensate so the corner highlight stays even.
    [`:where(${surfaceVariant}) &`]: {
      overflow: 'hidden',
      borderRadius: `calc(${tableBorderRadius} - 1px)`,
    },
  },
});

export const layout = styleVariants({
  auto: { tableLayout: 'auto' },
  fixed: { tableLayout: 'fixed' },
});

// --- Size ---

const sizeStyle = (
  pad: string,
  minHeight: string,
  borderRadius: string,
  type: (typeof typeScale)[TypeScale],
) => ({
  vars: {
    [cellPadding]: pad,
    [cellMinHeight]: minHeight,
    [tableBorderRadius]: borderRadius,
  },
  fontSize: type.fontSize,
  lineHeight: type.bodyLineHeight,
  letterSpacing: type.letterSpacing,
});

// Min-heights step 32 / 40 / 48 px. Radix lands 36 / 44 / 48 px at
// default scaling; our 9-step `space` doesn't have 36 or 44, so steps
// 1 and 2 round down to the nearest token (4px under) and step 3
// matches exactly. The earlier 40/48/64 progression overshot size-3
// by 16px relative to upstream.
export const size = styleVariants({
  1: sizeStyle(space[2], space[6], radius[3], typeScale[2]),
  2: sizeStyle(space[3], space[7], radius[4], typeScale[2]),
  3: sizeStyle(`${space[3]} ${space[4]}`, space[8], radius[4], typeScale[3]),
});

// --- Sections ---

export const header = style({
  verticalAlign: 'inherit',
  selectors: {
    // Tint the header row by re-declaring the cell-background var; it
    // cascades into every header cell.
    [`:where(${surfaceVariant}) &`]: {
      vars: { [rowBackground]: neutral.alpha[2] },
    },
  },
});

export const body = style({
  verticalAlign: 'inherit',
});

// --- Row ---

export const row = style({
  verticalAlign: 'inherit',
  selectors: {
    // The last body row sits on the wrapper's bottom edge inside the
    // surface variant — drop the divider shadow so the corner stays
    // clean. Re-declaring the var cascades into the row's cells.
    [`:where(${surfaceVariant} ${body}) &:last-child`]: {
      vars: { [rowDivider]: 'none' },
    },
  },
});

export const align = styleVariants({
  start: { verticalAlign: 'top' },
  center: { verticalAlign: 'middle' },
  end: { verticalAlign: 'bottom' },
  baseline: { verticalAlign: 'baseline' },
});

// --- Cell ---

export const cell = style({
  backgroundColor: rowBackground,
  boxShadow: rowDivider,
  boxSizing: 'border-box',
  verticalAlign: 'inherit',
  padding: cellPadding,
  // Acts as a min-height for content; `<td>` doesn't honor min-height
  // directly, but the table layout treats `height` as the floor.
  height: cellMinHeight,
});

export const columnHeaderCell = style({
  fontWeight: fontWeight.bold,
});

export const rowHeaderCell = style({
  fontWeight: fontWeight.regular,
});

export const justify = styleVariants({
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
});
