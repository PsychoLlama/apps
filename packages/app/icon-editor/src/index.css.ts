import { style } from '@vanilla-extract/css';
import { breakpoint, neutral, space } from '@lib/design';

// Workspace fills the viewport edge-to-edge below the SiteHeader. No
// outer padding or gaps — the canvas/rail share a single continuous
// slab divided only by 1px hairlines.
export const workspace = style({
  flex: '1 1 auto',
  minHeight: 0,
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

// Canvas is the focal surface. On mobile (column) it takes the minority
// 40% slice so the editing rail owns most of the viewport; on desktop
// (row) it fills whatever width the fixed-width rail leaves behind. The
// dot grid carries the design-tool vibe; no border-radius or outer
// border, since adjacent strips own the edges.
export const canvas = style({
  position: 'relative',
  flex: '1 1 40%',
  minWidth: 0,
  minHeight: 0,
  backgroundColor: neutral.alpha[1],
  backgroundImage: `radial-gradient(${neutral.alpha[6]} 1px, transparent 1px)`,
  backgroundSize: '16px 16px',
  backgroundPosition: 'center',
  overflow: 'hidden',
  '@media': {
    [breakpoint.md]: {
      flex: '1 1 auto',
    },
  },
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
// Flex column so the active panel can fill remaining height under the
// tab strip. On mobile it claims the majority 60% slice (matching the
// canvas's 40%); on desktop it becomes a fixed-width side column whose
// width steps up on wider viewports so the inspector keeps useful
// proportions on ultrawide monitors.
export const rail = style({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 60%',
  minHeight: 0,
  borderTop: `1px solid ${neutral.solid[4]}`,
  '@media': {
    [breakpoint.md]: {
      flex: '0 0 auto',
      width: '320px',
      borderTop: 'none',
      borderLeft: `1px solid ${neutral.solid[4]}`,
    },
    [breakpoint.lg]: { width: '380px' },
    [breakpoint.xl]: { width: '440px' },
  },
});

// Tab panel runs flush against the rail edges. Padding is internal so
// scroll content stays clear of the borders. Always a flex column so
// children can grow/shrink predictably. The rail carries a definite
// height on both axes now — its 60% slice on mobile, the row body on
// desktop — so the panel inherits a stable box and switching tabs
// doesn't reflow. The icon grid scrolls within whatever space remains
// after the search bar — never dictates the panel size.
export const tabPanel = style({
  paddingBlock: space[3],
  paddingInline: space[3],
  display: 'flex',
  flexDirection: 'column',
});

// Variant for the Icon panel — claims the rail's leftover height under
// the tab strip on every viewport.
export const tabPanelGrow = style({
  flex: '1 1 auto',
  minHeight: 0,
});
