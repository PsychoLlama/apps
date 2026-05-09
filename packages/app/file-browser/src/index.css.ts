import { style } from '@vanilla-extract/css';
import { breakpoint, neutral, space } from '@lib/design';

// Break the flex sizing cycle that keeps the host scrolling. The
// global body is `min-height: 100vh; display: flex; flex-direction:
// column`. With a default `flex-basis: auto`, `<main>` advertises
// its content height as its preferred main-size — body grows to
// match, the document scrolls, and `overflow: hidden` on a box
// that's already content-tall changes nothing. Forcing
// `flex-basis: 0` makes main's preferred height zero so body
// settles at its `min-height: 100vh` floor; `flex-grow: 1` (set
// via the `grow` prop) then expands main to that bounded height,
// and `overflow: hidden` finally has something to clip.
export const host = style({
  flexBasis: 0,
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
