import { createStore, defineAction, defineStore } from '@lib/state';
import type { RadiusScale } from '@lib/design';
import type {
  ArrowAlign,
  FloatingAlignment,
  FloatingPoint,
  FloatingSide,
} from '@lib/ui/_internal/floating-ui';

/** Placement inputs driving the floating window in the scratchpad. */
export interface FloatingControlsState {
  /** Anchor edge the window binds to. */
  side: FloatingSide;
  /** Placement along that edge. */
  align: FloatingAlignment;
  /** Placement of the arrow along that edge. */
  arrowAlign: ArrowAlign;
  /** Border radius of the surface. */
  radius: RadiusScale;
  /** Gap between the anchor edge (or point) and the window, in px. */
  sideOffset: number;
  /** Nudge along the bound edge, in px. */
  alignOffset: number;
  /**
   * Anchor-relative point the window binds to. `null` keeps edge mode.
   */
  point: FloatingPoint | null;
}

const floatingControlsStore = defineStore<FloatingControlsState>(() => ({
  side: 'bottom',
  align: 'center',
  arrowAlign: 'center',
  radius: 4,
  sideOffset: 0,
  alignOffset: 0,
  point: null,
}));

/** Live, readonly view of the floating-window placement controls. */
export const floatingControls = createStore(floatingControlsStore);

/** Bind the window to a different edge of the anchor. */
export const setSide = defineAction(
  [floatingControlsStore],
  (controls, side: FloatingSide) => {
    controls.side = side;
  },
);

/** Set the window's placement along the bound edge. */
export const setAlign = defineAction(
  [floatingControlsStore],
  (controls, align: FloatingAlignment) => {
    controls.align = align;
  },
);

/** Set the arrow's placement along the bound edge. */
export const setArrowAlign = defineAction(
  [floatingControlsStore],
  (controls, arrowAlign: ArrowAlign) => {
    controls.arrowAlign = arrowAlign;
  },
);

/** Set the surface's border radius. */
export const setRadius = defineAction(
  [floatingControlsStore],
  (controls, radius: RadiusScale) => {
    controls.radius = radius;
  },
);

/** Set the gap between the anchor edge (or point) and the window. */
export const setSideOffset = defineAction(
  [floatingControlsStore],
  (controls, sideOffset: number) => {
    controls.sideOffset = sideOffset;
  },
);

/** Set the nudge along the bound edge. */
export const setAlignOffset = defineAction(
  [floatingControlsStore],
  (controls, alignOffset: number) => {
    controls.alignOffset = alignOffset;
  },
);

/** Bind the window to a point inside the anchor, or `null` for edges. */
export const setPoint = defineAction(
  [floatingControlsStore],
  (controls, point: FloatingPoint | null) => {
    controls.point = point;
  },
);
