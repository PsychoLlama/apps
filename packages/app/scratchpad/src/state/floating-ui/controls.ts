import { defineFold, defineStore, defineTopic } from '@lib/state';
import type { RadiusScale } from '@lib/design';
import type {
  ArrowAlign,
  FloatingAlignment,
  FloatingPoint,
  FloatingSide,
} from '@lib/ui/_internal/floating-ui';
import { scratchpadScope } from './scope';

/** Placement inputs driving the floating window in the scratchpad. */
export interface FloatingControlsState {
  /** Anchor edge the window binds to. */
  side: FloatingSide;
  /** Placement along that edge. */
  align: FloatingAlignment;
  /** Whether the pointer arrow renders at all. */
  arrowVisible: boolean;
  /** Placement of the arrow along that edge. */
  arrowAlign: ArrowAlign;
  /** Length of the arrow's base edge, in px. */
  arrowBase: number;
  /** Depth the arrow protrudes toward the anchor, in px. */
  arrowDepth: number;
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

/** Every control at rest — the state the reset button restores. */
const defaults = (): FloatingControlsState => ({
  side: 'bottom',
  align: 'center',
  arrowVisible: true,
  arrowAlign: 'center',
  arrowBase: 16,
  arrowDepth: 8,
  radius: 4,
  sideOffset: 0,
  alignOffset: 0,
  point: null,
});

/** Live, readonly view of the floating-window placement controls. */
export const floatingControls = defineStore<FloatingControlsState>(
  scratchpadScope,
  defaults,
);

/** The window bound to a different edge of the anchor. */
export const sideChanged = defineTopic<FloatingSide>();
defineFold(sideChanged, [floatingControls], (controls, side) => {
  controls.side = side;
});

/** Placement along the bound edge changed. */
export const alignChanged = defineTopic<FloatingAlignment>();
defineFold(alignChanged, [floatingControls], (controls, align) => {
  controls.align = align;
});

/** The pointer arrow was shown or hidden. */
export const arrowVisibilityChanged = defineTopic<boolean>();
defineFold(
  arrowVisibilityChanged,
  [floatingControls],
  (controls, arrowVisible) => {
    controls.arrowVisible = arrowVisible;
  },
);

/** The arrow's placement along the bound edge changed. */
export const arrowAlignChanged = defineTopic<ArrowAlign>();
defineFold(arrowAlignChanged, [floatingControls], (controls, arrowAlign) => {
  controls.arrowAlign = arrowAlign;
});

/** The length of the arrow's base edge changed. */
export const arrowBaseChanged = defineTopic<number>();
defineFold(arrowBaseChanged, [floatingControls], (controls, arrowBase) => {
  controls.arrowBase = arrowBase;
});

/** How far the arrow protrudes toward the anchor changed. */
export const arrowDepthChanged = defineTopic<number>();
defineFold(arrowDepthChanged, [floatingControls], (controls, arrowDepth) => {
  controls.arrowDepth = arrowDepth;
});

/** The surface's border radius changed. */
export const radiusChanged = defineTopic<RadiusScale>();
defineFold(radiusChanged, [floatingControls], (controls, radius) => {
  controls.radius = radius;
});

/** The gap between the anchor edge (or point) and the window changed. */
export const sideOffsetChanged = defineTopic<number>();
defineFold(sideOffsetChanged, [floatingControls], (controls, sideOffset) => {
  controls.sideOffset = sideOffset;
});

/** The nudge along the bound edge changed. */
export const alignOffsetChanged = defineTopic<number>();
defineFold(alignOffsetChanged, [floatingControls], (controls, alignOffset) => {
  controls.alignOffset = alignOffset;
});

/** The window bound to a point inside the anchor, or `null` for edges. */
export const pointChanged = defineTopic<FloatingPoint | null>();
defineFold(pointChanged, [floatingControls], (controls, point) => {
  controls.point = point;
});

/** Every control put back to its default. */
export const controlsReset = defineTopic();
defineFold(controlsReset, [floatingControls], (controls) => {
  Object.assign(controls, defaults());
});
