import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '@lib/design';

// ScrollArea claims the rail's leftover height so the whole inspector
// scrolls as one column on short viewports. `flex: 1 1 0` keeps it
// from collapsing; `minHeight: 0` is the standard flex escape so the
// inner viewport actually scrolls instead of growing the rail.
export const scroller = style({
  flex: '1 1 0',
  minHeight: 0,
});

// Vertical padding lives on the content, not the ScrollArea root, so
// the scrollbar tracks the rail edge while text stays clear of it.
// Horizontal padding is deliberately omitted here and pushed down to
// each section so the dividers between them span the full rail width.
export const panel = style({
  paddingBlock: space[3],
});

// Per-section horizontal inset. Keeping the padding on the sections —
// not the panel — lets the sibling `<Separator>`s reach edge-to-edge.
export const section = style({
  paddingInline: space[3],
});

// The 48px glyph frame is itself the "choose icon" button. It holds the
// raw icon (no palette/shape — the canvas already shows the styled
// version), and its interactive states echo the icon-grid tiles.
export const thumbButton = style({
  flexShrink: 0,
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radius[2],
  border: `1px solid ${neutral.solid[5]}`,
  backgroundColor: neutral.alpha[2],
  color: neutral.solid[12],
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
  ':hover': {
    backgroundColor: neutral.alpha[3],
    borderColor: neutral.solid[6],
  },
  ':active': {
    backgroundColor: neutral.alpha[4],
  },
  ':focus-visible': {
    outline: 'none',
    borderColor: accent.solid[8],
    boxShadow: `0 0 0 2px ${accent.alpha[5]}`,
  },
});

// Empty-state frame — dashed + muted so it reads as a placeholder
// waiting to be filled rather than a real selection.
export const thumbButtonEmpty = style({
  borderStyle: 'dashed',
  color: neutral.solid[9],
});

export const thumbIcon = style({
  width: '70%',
  height: '70%',
});

// Holds the icon-id badge (or the empty-state prompt) and grows to fill
// the row, pushing the Randomize action to the far right. `minWidth: 0`
// lets the badge inside truncate instead of shoving the action off-edge.
export const idSlot = style({
  minWidth: 0,
});

// Icon-id badge. Names get long (e.g. "align-box-bottom-center-filled"),
// but `<Badge>` defaults to `inline-flex` + `nowrap` + `flex-shrink: 0`,
// so it would overflow the rail. `&&` doubles the class specificity to
// turn the badge into a single-line, shrink-to-fit ellipsis box.
export const iconBadge = style({
  selectors: {
    '&&': {
      display: 'block',
      minWidth: 0,
      flexShrink: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
});
