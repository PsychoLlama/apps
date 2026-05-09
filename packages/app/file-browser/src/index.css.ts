import { style } from '@vanilla-extract/css';
import { breakpoint, neutral, space } from '@lib/design';

// `<main>` defaults to `min-height: auto` (content height), so a
// long tree would push the host body past 100vh and break the
// chain that lets the inner ScrollArea constrain its viewport. The
// `host` rule pins `min-height: 0` on `<main>` itself; `workspace`
// keeps the same treatment for the column inside it.
export const host = style({
  minHeight: 0,
});

export const workspace = style({
  flex: '1 1 auto',
  minHeight: 0,
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
