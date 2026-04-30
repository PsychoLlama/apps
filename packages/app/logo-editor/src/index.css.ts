import { style } from '@vanilla-extract/css';
import { breakpoint, neutral, space } from '@lib/design';

// Workspace fills the viewport edge-to-edge below the SiteHeader. No
// outer padding or gaps — the toolbar/canvas/rail/status share a single
// continuous slab divided only by 1px hairlines.
export const workspace = style({
  flex: '1 1 auto',
  minHeight: 0,
});

// Toolbar is a flush strip; only the bottom edge is drawn.
export const toolbar = style({
  paddingBlock: space[1],
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

// Canvas is the focal surface — fills all the space the rail leaves
// behind. The dot grid carries the design-tool vibe; no border-radius
// or outer border, since adjacent strips own the edges.
export const canvas = style({
  position: 'relative',
  flex: '1 1 auto',
  minWidth: 0,
  backgroundColor: neutral.alpha[1],
  backgroundImage: `radial-gradient(${neutral.alpha[6]} 1px, transparent 1px)`,
  backgroundSize: '16px 16px',
  backgroundPosition: 'center',
  overflow: 'hidden',
});

// Positioned stage so the preview centers in the canvas.
export const canvasStage = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

// Rail is a single bordered slab hosting the @lib/ui Tabs primitive.
// Flex column so the icon panel's `tabPanelGrow` can fill remaining
// height under the tab strip. Width steps up on wider viewports so
// the inspector keeps useful proportions on ultrawide monitors.
export const rail = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  borderTop: `1px solid ${neutral.solid[4]}`,
  '@media': {
    [breakpoint.md]: {
      width: '320px',
      minHeight: 0,
      borderTop: 'none',
      borderLeft: `1px solid ${neutral.solid[4]}`,
    },
    [breakpoint.lg]: { width: '380px' },
    [breakpoint.xl]: { width: '440px' },
  },
});

// Tab panel runs flush against the rail edges. Padding is internal so
// scroll content stays clear of the borders. Always a flex column so
// children can grow/shrink predictably; the mobile `height` pins the
// panel to a fixed size so switching tabs doesn't reflow the rail.
// The icon grid scrolls within whatever space remains after the
// search bar — never dictates the panel size. Desktop unsets the
// fixed height; the rail has a definite height from the row body and
// `tabPanelGrow` lets the icon panel fill it directly.
export const tabPanel = style({
  paddingBlock: space[3],
  paddingInline: space[3],
  display: 'flex',
  flexDirection: 'column',
  height: '280px',
  '@media': {
    [breakpoint.md]: {
      height: 'auto',
    },
  },
});

// Variant for the Icon panel — claims the rail's leftover height on
// desktop. Mobile parents already supply the fixed height via
// `tabPanel`, so this is a no-op there.
export const tabPanelGrow = style({
  flex: '1 1 auto',
  minHeight: 0,
});

export const sectionRow = style({
  minHeight: space[5],
});

// Trailing meta text in a section header — truncates so long icon
// names never push the title.
export const sectionMeta = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
});

// Status bar mirrors the toolbar: only the top edge is drawn. Spec
// runs as a single nowrap row; overflow scrolls horizontally instead
// of wrapping so the bar height stays fixed at narrow widths. The
// fixed min-height keeps the bar from twitching as Spec's content
// reflows under state changes (palette name length, etc).
export const statusBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  minHeight: space[7],
  paddingBlock: space[1],
  paddingInline: space[3],
  borderTop: `1px solid ${neutral.solid[4]}`,
  overflowX: 'auto',
});
