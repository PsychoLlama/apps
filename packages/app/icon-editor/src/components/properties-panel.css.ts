import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

// ScrollArea claims the rail's leftover height so the whole inspector
// scrolls as one column on short viewports. `flex: 1 1 0` keeps it
// from collapsing; `minHeight: 0` is the standard flex escape so the
// inner viewport actually scrolls instead of growing the rail.
export const scroller = style({
  flex: '1 1 0',
  minHeight: 0,
});

// Inner padding lives on the content, not the ScrollArea root, so the
// scrollbar tracks the rail edge while text stays clear of it.
export const panel = style({
  paddingBlock: space[3],
  paddingInline: space[3],
});

// Selected-icon chip: square glyph thumbnail beside its identifier.
export const summary = style({
  minHeight: 0,
});

// Square frame holding the raw icon glyph (no palette/shape applied —
// the canvas already shows the styled version; this reads as "the
// icon you picked").
export const thumb = style({
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
});

// Empty-state frame — dashed + muted so it reads as a placeholder
// waiting to be filled rather than a real selection.
export const thumbEmpty = style({
  borderStyle: 'dashed',
  color: neutral.solid[9],
});

export const thumbIcon = style({
  width: '70%',
  height: '70%',
});

// Identifier column shrinks so long pack/name pairs truncate instead
// of shoving the thumbnail.
export const summaryText = style({
  minWidth: 0,
});
