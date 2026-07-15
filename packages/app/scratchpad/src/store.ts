import {
  defineCell,
  defineFold,
  defineScope,
  defineStore,
  defineTopic,
} from '@lib/state-next';
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
}

/** Owns the scratchpad's floating-window controls and anchor handle. */
export const scratchpadScope = defineScope();

/** Live, readonly view of the floating-window placement controls. */
export const floatingControls = defineStore<FloatingControlsState>(
  scratchpadScope,
  () => ({
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
  }),
);

/**
 * The hatched target element the floating window anchors against. A cell,
 * not store state — it holds a live DOM node that must never be proxied.
 */
export const anchorElement = defineCell<HTMLElement | null>(
  scratchpadScope,
  () => null,
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

/** The collision-avoidance tether was toggled. */
export const tetherToggled = defineTopic<boolean>();
defineFold(tetherToggled, [floatingControls], (controls, tether) => {
  controls.tether = tether;
});

/** The viewport clearance the tether maintains changed. */
export const tetherPaddingChanged = defineTopic<number>();
defineFold(
  tetherPaddingChanged,
  [floatingControls],
  (controls, tetherPadding) => {
    controls.tetherPadding = tetherPadding;
  },
);

/** One stage of the tether's pipeline was enabled or disabled. */
export const pluginToggled = defineTopic<{
  plugin: TetherPluginName;
  enabled: boolean;
}>();
defineFold(pluginToggled, [floatingControls], (controls, toggle) => {
  controls.plugins[toggle.plugin] = toggle.enabled;
});

/** The target element was captured so the tether can measure against it. */
export const anchorCaptured = defineTopic<HTMLElement>();
defineFold(anchorCaptured, [anchorElement], (anchor, element) => {
  anchor.current = element;
});
