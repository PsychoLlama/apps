import { style } from '@vanilla-extract/css';
import { breakpoint, neutral } from '@lib/design';

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

// Rail is a single bordered slab hosting the editing inspector — the
// always-on properties panel, or the full-rail icon picker swapped in
// via the Browse button. Flex column so whichever surface is mounted
// can fill the rail's height. On mobile it claims the majority 60%
// slice (matching the canvas's 40%); on desktop it becomes a fixed-
// width side column whose width steps up on wider viewports so the
// inspector keeps useful proportions on ultrawide monitors.
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
