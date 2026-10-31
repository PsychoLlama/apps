/**
 * DropdownMenu styles.
 *
 * Ported from Radix UI Themes BaseMenu, the styles DropdownMenu and
 * ContextMenu share. The surface is the floating primitive's body, so
 * its padding and radius arrive as props there.
 *
 * Deviations from Radix:
 * - The highlight follows `:focus` rather than a `data-highlighted`
 *   attribute. Hover moves focus, so the two are the same item.
 * - Disabled items carry a class rather than `data-disabled`.
 * - `--color-panel-solid` / `--shadow-5` map onto `background.panelSolid`
 *   / `shadow[5]`; `--gray-a*` onto `neutral.alpha`; `--accent-*` onto
 *   whichever palette the `color` props pick.
 * - Indicator icons are `1em`, tracking the item's type step, rather
 *   than fixed 8px / 10px. The `--scaling` factor is gone with them.
 * - No ScrollArea, and no `max-height` from the available height. The
 *   surface caps itself at the viewport, less the collision padding,
 *   and scrolls natively. Deferred: the tether doesn't measure the
 *   space left on its side.
 * - No `min-width: var(--radix-dropdown-menu-trigger-width)`. Deferred,
 *   as on `Popover`.
 * - Motion is `Popover`'s, which mirrors upstream's shared popper
 *   animation.
 * - Deferred: `highContrast` styling.
 *
 * @see https://www.radix-ui.com/themes/docs/components/dropdown-menu
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  background,
  danger,
  neutral,
  shadow,
  space,
  success,
  text,
  typeScale,
  warning,
  radius,
  type ColorPalette,
} from '@lib/design';

/**
 * How close the window may come to the viewport's edges, in px. Themes'
 * `collisionPadding`, shared by the tether and the size cap below.
 */
export const COLLISION_PADDING = 10;

// Set by the `size` variant on the surface, read by every part inside.
const itemHeight = createVar();
const itemPaddingStart = createVar();
const itemPaddingEnd = createVar();
const itemRadius = createVar();

// Set by the surface's `color`, and again by an item's own `color`, so
// an item paints its highlight in whichever palette is nearest.
const highlightSolid = createVar();
const highlightContrast = createVar();
const highlightSoft = createVar();

const ITEM_COLORS = { accent, neutral, danger, warning, success } as const;
const SURFACE_COLORS = { accent, neutral } as const;

/** The highlight vars a palette supplies. */
const highlightVars = (palette: ColorPalette) => ({
  [highlightSolid]: palette.solid[9],
  [highlightContrast]: palette.contrast,
  [highlightSoft]: palette.alpha[4],
});

/**
 * How the focused item is painted. Set on the surface; the items read
 * it, so it's declared ahead of them.
 */
export const variant = styleVariants({ solid: {}, soft: {} });

// --- Parts ---
// Declared before the surface rules that reach into them.

/** Any item: plain, checkbox, or radio. */
export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[2],
  height: itemHeight,
  paddingInlineStart: itemPaddingStart,
  paddingInlineEnd: itemPaddingEnd,
  position: 'relative',
  borderRadius: itemRadius,
  outline: 'none',
  cursor: 'default',
  // Upstream's fix for sticky selection highlighting in Firefox.
  userSelect: 'none',
  selectors: {
    // The variant's class outranks an item's own `color`, so the
    // highlight's text wins over the resting tint.
    [`${variant.solid} &:where(:focus)`]: {
      backgroundColor: highlightSolid,
      color: highlightContrast,
    },
    [`${variant.soft} &:where(:focus)`]: {
      backgroundColor: highlightSoft,
    },
  },
});

/** Items that toggle, which make room for an indicator. */
export const checkable = style({});

/** An item's `color`, which tints its text and its highlight. */
export const itemColor = styleVariants(ITEM_COLORS, (palette) => ({
  color: palette.alpha[11],
  vars: highlightVars(palette),
}));

/** An item that can't be chosen. Wins over its `color`. */
export const disabled = style({
  color: neutral.alpha[8],
});

/** The checkmark gutter at the start of a checkable item. */
export const indicator = style({
  position: 'absolute',
  insetInlineStart: 0,
  width: itemPaddingStart,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

/** The check or dash inside the gutter. */
export const indicatorIcon = style({
  width: '1em',
  height: '1em',
});

/** The keyboard shortcut at the end of an item. */
export const shortcut = style({
  display: 'flex',
  alignItems: 'center',
  marginInlineStart: 'auto',
  paddingInlineStart: space[4],
  color: neutral.alpha[11],
  selectors: {
    [`${item}:where(:focus, ${disabled}) &`]: { color: 'inherit' },
  },
});

/** A rule between groups of items. */
export const separator = style({
  height: '1px',
  marginBlock: space[2],
  marginInlineStart: itemPaddingStart,
  marginInlineEnd: itemPaddingEnd,
  backgroundColor: neutral.alpha[6],
});

/** A heading over a run of items. Not focusable. */
export const label = style({
  display: 'flex',
  alignItems: 'center',
  height: itemHeight,
  paddingInlineStart: itemPaddingStart,
  paddingInlineEnd: itemPaddingEnd,
  color: neutral.alpha[10],
  userSelect: 'none',
  cursor: 'default',
  selectors: {
    [`${item} + &`]: { marginTop: space[2] },
  },
});

/** A group of items. Lays them out as the surface does. */
export const group = style({
  display: 'flex',
  flexDirection: 'column',
});

// --- Surface ---

/** The surface. Padding and radius are props. */
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: background.panelSolid,
  color: text.highContrast,
  boxShadow: shadow[5],
  // Collisions can move the window but not shrink it, so the viewport
  // caps it.
  maxWidth: `calc(100vw - ${2 * COLLISION_PADDING}px)`,
  maxHeight: `calc(100vh - ${2 * COLLISION_PADDING}px)`,
  overflow: 'auto',
  outline: 'none',
});

/** Surface size: item metrics and type step. */
export const size = styleVariants({
  1: {
    fontSize: typeScale[1].fontSize,
    lineHeight: typeScale[1].bodyLineHeight,
    letterSpacing: typeScale[1].letterSpacing,
    vars: {
      [itemHeight]: space[5],
      [itemPaddingStart]: space[2],
      [itemPaddingEnd]: space[2],
      [itemRadius]: radius[1],
    },
    selectors: {
      [`&:where(:has(${checkable}))`]: {
        vars: { [itemPaddingStart]: `calc(${space[5]} / 1.2)` },
      },
    },
  },
  2: {
    fontSize: typeScale[2].fontSize,
    lineHeight: typeScale[2].bodyLineHeight,
    letterSpacing: typeScale[2].letterSpacing,
    vars: {
      [itemHeight]: space[6],
      [itemPaddingStart]: space[3],
      [itemPaddingEnd]: space[3],
      [itemRadius]: radius[2],
    },
    selectors: {
      [`&:where(:has(${checkable}))`]: {
        vars: { [itemPaddingStart]: space[5] },
      },
    },
  },
});

/** The surface's `color`, which every item highlights in by default. */
export const color = styleVariants(SURFACE_COLORS, (palette) => ({
  vars: highlightVars(palette),
}));
