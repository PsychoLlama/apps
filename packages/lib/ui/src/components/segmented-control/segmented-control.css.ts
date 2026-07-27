/**
 * SegmentedControl styles.
 *
 * Ported from Radix UI Themes SegmentedControl. The root is an
 * `inline-grid` track of equal `1fr` columns; each item is a `<label>`
 * wrapping a visually-hidden `<input type="radio">`. One absolutely
 * positioned indicator slides between columns via `translateX`.
 *
 * Deviations from Radix:
 * - State is driven by `:has(input:checked)` / `:has(input:focus-visible)`
 *   / `:has(input:disabled)` rather than `data-state="on|off"` and
 *   `[disabled]` attributes — the native input owns the truth, so the
 *   indicator lands in the right column during SSR with no JS.
 * - Upstream stacks the indicator and the separators under the labels
 *   with `z-index: -1`. `z-index` is banned here, so the layering is
 *   rebuilt out of paint order instead: the indicator is the root's
 *   *first* child (positioned descendants paint in tree order, so every
 *   later item draws over it), the separators stay unpositioned (so
 *   they paint below every positioned descendant, including the
 *   indicator), and each item's content span is `position: relative` to
 *   lift the label and its focus ring above the indicator. Same three
 *   layers, no stacking-context budget spent.
 * - Because the indicator no longer trails the items, its column width
 *   and slide offset can't be read off sibling combinators. Both come
 *   from `:has()` probes on the root keyed to `:nth-of-type`, generated
 *   from {@link MAX_ITEMS} rather than hand-written. Same 10-item
 *   ceiling as upstream.
 * - Timings ride the motion scale: `fast[2]` for the slide (upstream
 *   100ms) and `fast[1]` for the label / separator cross-fades
 *   (upstream 80ms). Upstream's `ease-in` / `ease-out` alternation maps
 *   onto `exit.productive` (disappearing) and `entrance.productive`
 *   (appearing), and durations collapse under `prefers-reduced-motion`.
 * - The slide easing is `standard.productive` rather than upstream's
 *   bespoke `cubic-bezier(0.445, 0.05, 0.55, 0.95)`.
 * - Per-item disabled styling keys off that item's own input rather
 *   than upstream's "any disabled item in the group" selector, so one
 *   disabled segment doesn't wash out the whole control.
 * - Drops upstream's `--tab-active-word-spacing` / `--tab-inactive-word-spacing`
 *   pair. Both resolve to `0em`, so they never moved anything.
 * - The size's icon gap lands on each label copy rather than on their
 *   wrapper. Upstream puts it on the wrapper, whose only in-flow child
 *   is the checked copy (the unchecked one is absolutely positioned), so
 *   the gap never reaches an item's icon and text.
 * - Drops upstream's `svg { flex-shrink: 0 }` guard. It would need a
 *   `globalStyle`, which is reserved for `@lib/design`, and the root's
 *   `min-width: max-content` already keeps columns from compressing
 *   below their content unless a consumer caps the track's width.
 * - Skips `highContrast` (deferred deviation).
 *
 * @see https://www.radix-ui.com/themes/docs/components/segmented-control
 */

import {
  createVar,
  style,
  styleVariants,
  type StyleRule,
} from '@vanilla-extract/css';
import {
  accent,
  background,
  entrance,
  exit,
  fast,
  fontFamily,
  fontWeight,
  neutral,
  radius,
  shadow,
  space,
  standard,
  typeScale,
  type RadiusScale,
  type SpaceScale,
  type TypeScale,
} from '@lib/design';
import { assignColorSchemeVars } from '@lib/design/color-scheme';

/**
 * Ceiling for the generated indicator rules. Matches upstream's
 * hand-written `nth-child` ladders. Past this the indicator has no
 * matching width and collapses — a control with more than ten segments
 * wants a `<select>`, not a track.
 */
const MAX_ITEMS = 10;

type SelectorMap = NonNullable<StyleRule['selectors']>;

// Set by the root's size / radius variants; read by the items, their
// content spans, and the indicator's rounded `::before`.
const rootRadius = createVar();
const contentPaddingX = createVar();
const contentGap = createVar();
// Set by the root's variant; read by the indicator's `::before`.
const indicatorShadow = createVar();

// The indicator reads as a chip lifted out of the track. Light mode
// paints it opaque against the translucent track; dark mode layers a
// translucent wash instead — matching upstream's `--color-background` /
// `--gray-a3` split, which is structurally different enough per scheme
// to need vars rather than `light-dark()`.
const indicatorBackground = createVar();

assignColorSchemeVars(
  { [indicatorBackground]: background.page },
  { [indicatorBackground]: neutral.alpha[3] },
);

// Active-state typography deltas, matching Radix's
// `--tab-active-letter-spacing` / `--tab-inactive-letter-spacing`. The
// same pair drives Tabs; duplicated here because the two components
// don't otherwise share a stylesheet.
const ACTIVE_LETTER_SPACING = '-0.01em';
const INACTIVE_LETTER_SPACING = '0em';

/** Hairline width for the seams between segments and the chip's inset. */
const HAIRLINE = '1px';

// --- Root ---

export const root = style({
  display: 'inline-grid',
  gridAutoFlow: 'column',
  gridAutoColumns: '1fr',
  alignItems: 'stretch',
  verticalAlign: 'top',
  position: 'relative',
  minWidth: 'max-content',
  borderRadius: rootRadius,
  color: neutral.solid[12],
  backgroundColor: background.surface,
  // Layered over `background-color` rather than replacing it, so the
  // track reads as a tinted recess on light and dark surfaces alike.
  backgroundImage: `linear-gradient(${neutral.alpha[3]}, ${neutral.alpha[3]})`,
  fontFamily: fontFamily.body,
  textAlign: 'center',
  // New stacking context, so the indicator and separators resolve their
  // paint order against this element rather than escaping to whatever
  // ancestor happens to be positioned.
  isolation: 'isolate',

  selectors: {
    '&:where([data-disabled])': {
      backgroundColor: neutral.solid[3],
    },
  },
});

// --- Visually-hidden `<input type="radio">` ---
//
// Same treatment as RadioGroup / RadioCards: kept in flow (focusable,
// form-submittable) but clipped to nothing. The wrapping `<label>` is
// the visible target, and every state style hangs off `:has(input:…)`.

export const input = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
});

// --- Item (the styled `<label>`) ---
//
// Deliberately unpositioned: that's what keeps its separator painting
// below the indicator. Only the content span inside it gets lifted.

export const item = style({
  display: 'flex',
  alignItems: 'stretch',
  cursor: 'pointer',
  userSelect: 'none',

  selectors: {
    // End caps inherit the track's rounding; the content span inherits
    // it again so hover fills stay clipped to the corner.
    '&:where(:first-of-type)': {
      borderTopLeftRadius: rootRadius,
      borderBottomLeftRadius: rootRadius,
    },
    '&:where(:last-of-type)': {
      borderTopRightRadius: rootRadius,
      borderBottomRightRadius: rootRadius,
    },
    '&:where(:has(input:disabled))': {
      cursor: 'not-allowed',
    },
  },
});

// --- Content ---
//
// Fills the item exactly. The separator is a zero-outer-width flex
// sibling, so this span still spans the full column — which is why the
// focus ring can live here instead of on the item and stay pixel-aligned
// with upstream's geometry, while paint order keeps it above the chip.

export const content = style({
  position: 'relative',
  display: 'flex',
  flexGrow: 1,
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  borderRadius: 'inherit',
  paddingInline: contentPaddingX,

  selectors: {
    [`${item}:where(:has(input:disabled)) &`]: {
      color: neutral.alpha[8],
    },
    // Focus rounds all four corners — including on middle items — so
    // the ring reads as a discrete chip rather than a clipped slab.
    // `outline-offset: -1px` pulls it inside the track's edge, landing
    // it flush against the indicator's inset rather than over it.
    [`${item}:where(:has(input:focus-visible)) &`]: {
      borderRadius: rootRadius,
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: `-${HAIRLINE}`,
    },
  },

  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${item}:where(:not(:has(input:checked)):not(:has(input:disabled)):hover) &`]:
          { backgroundColor: neutral.alpha[2] },
      },
    },
  },
});

/**
 * Cross-fade pair. Both copies of the children stack in the same spot:
 * the active copy stays in flow (so the column is always sized to the
 * wider medium-weight metrics) while the inactive copy is absolutely
 * positioned over it. Swapping opacity instead of swapping text is what
 * keeps the track from reflowing on selection.
 */
const crossFade = (visibleWhenChecked: boolean): StyleRule => ({
  // Each copy is its own flex row, so an item rendered as icon + text
  // gets the size's gap between them. Upstream hangs the gap on the
  // wrapper instead, where the only in-flow child is the checked copy —
  // leaving icons flush against their labels.
  display: 'flex',
  alignItems: 'center',
  gap: contentGap,
  transitionProperty: 'opacity',
  transitionDuration: fast[1],
  opacity: visibleWhenChecked ? 0 : 1,
  transitionTimingFunction: visibleWhenChecked
    ? exit.productive
    : entrance.productive,
  selectors: {
    [`${item}:where(:has(input:checked)) &`]: {
      opacity: visibleWhenChecked ? 1 : 0,
      transitionTimingFunction: visibleWhenChecked
        ? entrance.productive
        : exit.productive,
    },
  },
});

/** Visible while checked. In flow — reserves the column's width. */
export const labelChecked = style([
  crossFade(true),
  {
    fontWeight: fontWeight.medium,
    letterSpacing: ACTIVE_LETTER_SPACING,
  },
]);

/** Visible while unchecked. Overlays the checked copy without sizing it. */
export const labelUnchecked = style([
  crossFade(false),
  {
    // Auto insets keep it at its static position, so it lines up with
    // the checked copy without any explicit offsets.
    position: 'absolute',
    fontWeight: fontWeight.regular,
    letterSpacing: INACTIVE_LETTER_SPACING,
  },
]);

// --- Separator ---

export const separator = style({
  width: HAIRLINE,
  // Pull back by half the hairline so it straddles the seam between two
  // columns instead of sitting inside one, and so its outer width nets
  // to zero — the content span next to it still fills the whole column.
  marginInline: `calc(${HAIRLINE} / -2)`,
  // One space step of breathing room, minus the hairline itself.
  // Resolves to upstream's 3px at the default scale.
  marginBlock: `calc(${space[1]} - ${HAIRLINE})`,
  backgroundColor: neutral.alpha[4],
  transitionProperty: 'opacity',
  transitionDuration: fast[1],
  // Slow to disappear, quick to reappear — keeps the seams from
  // flickering as the indicator slides past them.
  transitionTimingFunction: entrance.productive,

  selectors: {
    // The leading edge has no seam to draw, and the seams flanking the
    // checked (or focused) item are covered by its chip / ring.
    [`${item}:where(:first-of-type) &`]: {
      opacity: 0,
    },
    [`${item}:where(:has(input:checked), :has(input:focus-visible)) &`]: {
      opacity: 0,
      transitionTimingFunction: exit.productive,
    },
    [`${item}:where(:has(input:checked), :has(input:focus-visible)) + * &`]: {
      opacity: 0,
      transitionTimingFunction: exit.productive,
    },
    // A focus ring appears instantly, so the seams it hides shouldn't
    // linger behind it.
    [`${root}:where(:has(input:focus-visible)) &`]: {
      transitionProperty: 'none',
    },
  },
});

// --- Indicator ---
//
// The root's first child, so every item paints over it. Two boxes: the
// outer one owns the column geometry and the slide; `::before` insets a
// hairline and carries the fill, rounding, and variant shadow.
//
// Both ladders probe the root with `:has()` rather than reading sibling
// combinators, because the indicator now *precedes* the items it
// describes.

/** Column width, probed from how many items the root actually has. */
const indicatorWidths = (): SelectorMap => {
  const rules: SelectorMap = {};
  for (let count = 1; count <= MAX_ITEMS; count++) {
    rules[
      `${root}:where(:has(> ${item}:nth-of-type(${count}):last-of-type)) > &`
    ] = { width: `calc(100% / ${count})` };
  }
  return rules;
};

/** Slide offset, probed from which column holds the checked input. */
const indicatorOffsets = (): SelectorMap => {
  const rules: SelectorMap = {};
  for (let index = 1; index <= MAX_ITEMS; index++) {
    rules[
      `${root}:where(:has(> ${item}:nth-of-type(${index}) input:checked)) > &`
    ] = { transform: `translateX(${(index - 1) * 100}%)` };
  }
  return rules;
};

export const indicator = style({
  // Hidden until something is checked — an unselected control is a
  // bare track.
  display: 'none',
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  pointerEvents: 'none',
  transitionProperty: 'transform',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,

  '::before': {
    content: '""',
    position: 'absolute',
    // Inset by the hairline so the chip never covers the track's own
    // edge; the radius shrinks to match so the corners stay concentric.
    inset: HAIRLINE,
    borderRadius: `max(0.5px, calc(${rootRadius} - ${HAIRLINE}))`,
    backgroundColor: indicatorBackground,
    boxShadow: indicatorShadow,
  },

  selectors: {
    [`${root}:where(:has(> ${item} input:checked)) > &`]: {
      display: 'block',
    },
    // A disabled selection drops the lift and fills the whole column,
    // so it reads as inert rather than as a raised control.
    [`${root}:where(:has(> ${item} input:checked:disabled)) > &`]: {
      vars: { [indicatorBackground]: neutral.alpha[3] },
    },
    [`${root}:where(:has(> ${item} input:checked:disabled)) > &::before`]: {
      inset: 0,
      boxShadow: 'none',
    },
    ...indicatorWidths(),
    ...indicatorOffsets(),
  },
});

// --- Size ---
//
// Heights and paddings match upstream one-for-one — the space scale is
// the same 4px ramp Radix ships. Typography is set on the root and
// inherits down to the labels.

interface SizeStyle {
  /** Overall track height. */
  height: SpaceScale;
  /** Inline padding on the content span. */
  padX: SpaceScale;
  /** Space between an icon and its text. */
  iconGap: SpaceScale;
  /** Track rounding. Overridden wholesale by the `radius` prop. */
  rad: RadiusScale;
  /** Type scale step. */
  font: TypeScale;
}

const sizeStyle = ({ height, padX, iconGap, rad, font }: SizeStyle) => ({
  height: space[height],
  fontSize: typeScale[font].fontSize,
  lineHeight: typeScale[font].bodyLineHeight,
  letterSpacing: typeScale[font].letterSpacing,
  vars: {
    [rootRadius]: radius[rad],
    [contentPaddingX]: space[padX],
    [contentGap]: space[iconGap],
  },
});

export const size = styleVariants({
  1: sizeStyle({ height: 5, padX: 3, iconGap: 1, rad: 2, font: 1 }),
  2: sizeStyle({ height: 6, padX: 4, iconGap: 2, rad: 2, font: 2 }),
  3: sizeStyle({ height: 7, padX: 4, iconGap: 3, rad: 3, font: 3 }),
});

// --- Radius ---
//
// Declared after `size` so that, at equal specificity, source order
// hands the override to the explicit `radius` prop.

export const radiusVariant = styleVariants({
  none: { vars: { [rootRadius]: '0px' } },
  small: { vars: { [rootRadius]: radius[1] } },
  medium: { vars: { [rootRadius]: radius[2] } },
  large: { vars: { [rootRadius]: radius[3] } },
  full: { vars: { [rootRadius]: radius.full } },
});

// --- Variant ---
//
// The only thing that diverges is how the chip separates itself from
// the track: `surface` draws a hairline ring, `classic` floats it on a
// shadow.

export const variant = styleVariants({
  surface: {
    vars: { [indicatorShadow]: `0 0 0 ${HAIRLINE} ${neutral.alpha[4]}` },
  },
  classic: { vars: { [indicatorShadow]: shadow[2] } },
});
