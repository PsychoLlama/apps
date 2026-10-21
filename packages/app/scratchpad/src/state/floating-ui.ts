/**
 * State for the floating-UI experiment: every placement input the floating
 * window takes, plus the tether's middleware. All of it is page-local and
 * dies with the route. The one persisted control, whether the tether is
 * enabled, lives in `@lib/runtime-config` and is read through
 * `$tetherEnabled` instead.
 */

import { defineCommand, defineStore } from '@lib/state';
import type { RadiusScale } from '@lib/design';
import type {
  FloatingAlignment,
  FloatingPoint,
  FloatingRootDisplay,
  FloatingSide,
} from '@lib/ui/_internal/floating-ui';

/** One toggleable middleware the tether can run. */
export type TetherMiddleware = 'flip' | 'shift';

/** Every middleware, in the order the tether runs them. */
export const TETHER_MIDDLEWARE = [
  'flip',
  'shift',
] as const satisfies TetherMiddleware[];

/**
 * Where `flip` may take the window: the library's computed fallback, or
 * a hand-written `position-try`-style chain.
 */
export type FlipMode = 'auto' | 'chain';

/** Placement inputs driving the floating window in the scratchpad. */
export interface FloatingControlsState {
  /**
   * How the root sits in the flow: `block` anchors to the hatched box,
   * `inline` to a word in a paragraph.
   */
  display: FloatingRootDisplay;
  /** Anchor edge the window binds to. */
  side: FloatingSide;
  /** Placement along that edge. */
  align: FloatingAlignment;
  /** Whether the pointer arrow renders at all. */
  arrowVisible: boolean;
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
  /** Which middleware the tether runs. */
  middleware: Record<TetherMiddleware, boolean>;
  /** Where `flip` may take the window. */
  flipMode: FlipMode;
}

/** Every control at rest — the state the reset button restores. */
const defaults = (): FloatingControlsState => ({
  display: 'block',
  side: 'top',
  align: 'start',
  arrowVisible: true,
  arrowBase: 16,
  arrowDepth: 8,
  radius: 4,
  sideOffset: 0,
  alignOffset: 0,
  point: null,
  middleware: {
    flip: true,
    shift: true,
  },
  flipMode: 'auto',
});

/** Live, readonly view of the floating-window placement controls. */
export const $floatingControls = defineStore(defaults);

/** The anchor swapped between the block box and the inline word. */
export const $displayChanged = defineCommand(
  [$floatingControls],
  (controls) => (display: FloatingRootDisplay) => {
    controls.display = display;
  },
);

/** The window bound to a different edge of the anchor. */
export const $sideChanged = defineCommand(
  [$floatingControls],
  (controls) => (side: FloatingSide) => {
    controls.side = side;
  },
);

/** Placement along the bound edge changed. */
export const $alignChanged = defineCommand(
  [$floatingControls],
  (controls) => (align: FloatingAlignment) => {
    controls.align = align;
  },
);

/** The pointer arrow was shown or hidden. */
export const $arrowVisibilityChanged = defineCommand(
  [$floatingControls],
  (controls) => (arrowVisible: boolean) => {
    controls.arrowVisible = arrowVisible;
  },
);

/** The length of the arrow's base edge changed. */
export const $arrowBaseChanged = defineCommand(
  [$floatingControls],
  (controls) => (arrowBase: number) => {
    controls.arrowBase = arrowBase;
  },
);

/** How far the arrow protrudes toward the anchor changed. */
export const $arrowDepthChanged = defineCommand(
  [$floatingControls],
  (controls) => (arrowDepth: number) => {
    controls.arrowDepth = arrowDepth;
  },
);

/** The surface's border radius changed. */
export const $radiusChanged = defineCommand(
  [$floatingControls],
  (controls) => (radius: RadiusScale) => {
    controls.radius = radius;
  },
);

/** The gap between the anchor edge (or point) and the window changed. */
export const $sideOffsetChanged = defineCommand(
  [$floatingControls],
  (controls) => (sideOffset: number) => {
    controls.sideOffset = sideOffset;
  },
);

/** The nudge along the bound edge changed. */
export const $alignOffsetChanged = defineCommand(
  [$floatingControls],
  (controls) => (alignOffset: number) => {
    controls.alignOffset = alignOffset;
  },
);

/** The window bound to a point inside the anchor, or `null` for edges. */
export const $pointChanged = defineCommand(
  [$floatingControls],
  (controls) => (point: FloatingPoint | null) => {
    controls.point = point;
  },
);

/**
 * The middleware group changed. Carries the whole selection rather than
 * one flag: the cards report their new set as a unit, and writing it
 * wholesale keeps the group and the store from drifting apart.
 */
export const $middlewareChanged = defineCommand(
  [$floatingControls],
  (controls) => (enabled: readonly TetherMiddleware[]) => {
    for (const name of TETHER_MIDDLEWARE) {
      controls.middleware[name] = enabled.includes(name);
    }
  },
);

/** Where `flip` may take the window changed. */
export const $flipModeChanged = defineCommand(
  [$floatingControls],
  (controls) => (mode: FlipMode) => {
    controls.flipMode = mode;
  },
);

/** Every control put back to its default. */
export const $controlsReset = defineCommand(
  [$floatingControls],
  (controls) => () => {
    Object.assign(controls, defaults());
  },
);
