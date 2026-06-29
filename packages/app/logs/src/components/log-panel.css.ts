import { style } from '@vanilla-extract/css';
import { inset } from '@lib/shell/frame.css';

/**
 * The meta columns (time, level, origin) read as a single token each — let
 * them size to content and never wrap, so only the message column reflows.
 */
export const metaCell = style({
  whiteSpace: 'nowrap',
});

/**
 * Break the table's scrollport flush to the frame edges. `FrameBody` holds its
 * content off the viewport by `inset`; on a narrow screen that reads as a dead
 * gutter at both ends of a horizontally scrolling table. A negative inline
 * margin pulls the wrapper — and the `ScrollArea` viewport inside it — back out
 * to the edges so the scroll runs edge to edge. The gutter is re-paid inside,
 * on the leading and trailing cells, so columns still sit where they would
 * without the breakout. Margin and cell padding read the same `inset` var, so
 * the breakout can never drift wider than the gutter it restores.
 */
export const breakout = style({
  marginInline: `calc(${inset} * -1)`,
});

/** Leading-edge gutter: re-pads the first column to the frame inset. */
export const leadingGutter = style({
  paddingInlineStart: inset,
});

/** Trailing-edge gutter: re-pads the last column to the frame inset. */
export const trailingGutter = style({
  paddingInlineEnd: inset,
});

/**
 * Floor for the message column's measure. Under `table-layout: auto` a
 * `width: 100%` table that overflows collapses its flex column to the
 * narrowest word — on mobile the message shreds into a one-word sliver and
 * the row towers. A min measure holds the column readable; the table scrolls
 * horizontally to honor it rather than mangling the text. Wide viewports never
 * hit the floor, so desktop wrapping is unchanged.
 */
export const messageCell = style({
  minWidth: '32ch',
});
