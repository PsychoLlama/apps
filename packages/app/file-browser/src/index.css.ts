import { style } from '@vanilla-extract/css';
import { breakpoint, neutral, space } from '@lib/design';

// Pin `<main>` to the viewport. Without this, the global body's
// `min-height: 100vh` lets the document grow under a tall tree:
// `min-height: 0` alone allows children to shrink, but content
// visually overflows and the outer page scrolls. Clipping at the
// host stops that leak so the leaf `ScrollArea` is the only thing
// that scrolls.
export const host = style({
  minHeight: 0,
  overflow: 'hidden',
});

export const workspace = style({
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'hidden',
});

export const toolbar = style({
  paddingBlock: space[2],
  paddingInline: space[3],
  borderBottom: `1px solid ${neutral.solid[4]}`,
});

export const body = style({
  flex: '1 1 auto',
  minHeight: 0,
  flexDirection: 'column',
  '@media': {
    [breakpoint.md]: {
      flexDirection: 'row',
    },
  },
});

// Tree rail. On wide viewports it sits on the left at a fixed width;
// on mobile it stacks above the metadata pane.
export const tree = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  borderBottom: `1px solid ${neutral.solid[4]}`,
  maxHeight: '40vh',
  '@media': {
    [breakpoint.md]: {
      width: '320px',
      maxHeight: 'none',
      minHeight: 0,
      borderBottom: 'none',
      borderRight: `1px solid ${neutral.solid[4]}`,
    },
    [breakpoint.lg]: { width: '380px' },
    [breakpoint.xl]: { width: '440px' },
  },
});

// ScrollArea owns its own overflow; we just constrain its track in
// the surrounding flex layout. The vertical padding lands inside the
// scrollable viewport so the first/last rows breathe past the edge.
export const treeScroll = style({
  flex: '1 1 auto',
  minHeight: 0,
  paddingBlock: space[2],
});

// Metadata pane fills the remaining space.
export const detail = style({
  flex: '1 1 auto',
  minHeight: 0,
  minWidth: 0,
});

export const callout = style({
  marginBlock: space[3],
  marginInline: space[3],
});
