import {
  createStore,
  defineAction,
  defineStore,
  ref,
  type Ref,
} from '@lib/state';
import type { RadiusScale } from '@lib/design';
import type {
  ArrowAlign,
  FloatingAlignment,
  FloatingPoint,
  FloatingSide,
} from '@lib/ui/_internal/floating-ui';

/** One toggleable stage of the tether's decision pipeline. */
export type TetherPluginName = 'positionTry';

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
  /** Whether the collision-avoidance tether is active. */
  tether: boolean;
  /** Viewport clearance the tether maintains, in px. */
  tetherPadding: number;
  /** Which pipeline stages the tether runs. */
  plugins: Record<TetherPluginName, boolean>;
  /** The hatched target element the floating window anchors against. */
  anchorElement: Ref<HTMLElement | null>;
}

const floatingControlsStore = defineStore<FloatingControlsState>(() => ({
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
  tether: false,
  tetherPadding: 8,
  plugins: {
    positionTry: true,
  },
  anchorElement: ref(null),
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

/** Show or hide the pointer arrow. */
export const setArrowVisible = defineAction(
  [floatingControlsStore],
  (controls, arrowVisible: boolean) => {
    controls.arrowVisible = arrowVisible;
  },
);

/** Set the arrow's placement along the bound edge. */
export const setArrowAlign = defineAction(
  [floatingControlsStore],
  (controls, arrowAlign: ArrowAlign) => {
    controls.arrowAlign = arrowAlign;
  },
);

/** Set the length of the arrow's base edge. */
export const setArrowBase = defineAction(
  [floatingControlsStore],
  (controls, arrowBase: number) => {
    controls.arrowBase = arrowBase;
  },
);

/** Set how far the arrow protrudes toward the anchor. */
export const setArrowDepth = defineAction(
  [floatingControlsStore],
  (controls, arrowDepth: number) => {
    controls.arrowDepth = arrowDepth;
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

/** Toggle the collision-avoidance tether. */
export const setTether = defineAction(
  [floatingControlsStore],
  (controls, tether: boolean) => {
    controls.tether = tether;
  },
);

/** Set the viewport clearance the tether maintains. */
export const setTetherPadding = defineAction(
  [floatingControlsStore],
  (controls, tetherPadding: number) => {
    controls.tetherPadding = tetherPadding;
  },
);

/** Enable or disable one stage of the tether's pipeline. */
export const setPluginEnabled = defineAction(
  [floatingControlsStore],
  (controls, toggle: { plugin: TetherPluginName; enabled: boolean }) => {
    controls.plugins[toggle.plugin] = toggle.enabled;
  },
);

/** Remember the target element so the tether can measure against it. */
export const setAnchorElement = defineAction(
  [floatingControlsStore],
  (controls, element: HTMLElement) => {
    controls.anchorElement = ref(element);
  },
);
