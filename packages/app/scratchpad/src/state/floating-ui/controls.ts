import { defineFold, defineStore, defineTopic } from '@lib/state';
import { environment } from '@lib/runtime-config';
import type { RadiusScale } from '@lib/design';
import type {
  ArrowAlign,
  FloatingAlignment,
  FloatingPoint,
  FloatingSide,
} from '@lib/ui/_internal/floating-ui';
import { tetherDisabled as tetherDisabledOption } from '../../config';
import { scratchpadScope } from './scope';

/** One toggleable collision behavior the tether can run. */
export type TetherFeature = 'shift' | 'size';

/** Every collision behavior, in the order the scratchpad lists them. */
export const TETHER_FEATURES = [
  'shift',
  'size',
] as const satisfies TetherFeature[];

/**
 * One card in the tether-behaviors group. `clamp` isn't a pass the
 * tether runs — it's the surface opting into what the `size` pass
 * measured — but it toggles the same way, so it rides in the same group.
 */
export type TetherBehavior = TetherFeature | 'clamp';

/**
 * How the tether's flip pass is configured: the library's computed
 * fallback, the pass turned off, or a hand-written `position-try`-style
 * chain.
 */
export type FlipMode = 'auto' | 'off' | 'chain';

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
  /**
   * Whether to stand the tether down (`tether={false}`), leaving the
   * pure-CSS placement in sole charge — the pre-hydration state, held
   * open indefinitely.
   *
   * The one control that outlives the page. It persists through
   * `@lib/runtime-config`, so `trackTetherConfigSaga` is its only writer
   * here — the checkbox writes to OPFS and the change comes back around.
   */
  tetherDisabled: boolean;
  /** Boundary clearance the tether maintains, in px. */
  tetherPadding: number;
  /** Which collision behaviors the tether runs. */
  features: Record<TetherFeature, boolean>;
  /** How the tether's flip pass is configured. */
  flipMode: FlipMode;
  /** Whether the surface clamps itself to the room the tether reports. */
  clampToAvailable: boolean;
}

/**
 * Every control at rest — the state the reset button restores. The
 * persisted one seeds from its option's per-environment default so
 * prerender and the client's first paint agree (no hydration flash), and
 * so a reset lands on the same value clearing the override reverts to.
 */
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
  tetherDisabled: tetherDisabledOption.defaults[environment].disabled,
  tetherPadding: 8,
  features: {
    shift: true,
    size: true,
  },
  flipMode: 'auto',
  clampToAvailable: false,
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

/**
 * Standing the tether down resolved to a new value.
 *
 * Published by the runtime-config subscription, never by the checkbox
 * that triggered a change: the toggle persists through
 * `@lib/runtime-config` and the change comes back around here, so a
 * same-tab write lands exactly the way a sibling tab's would.
 */
export const tetherDisabledChanged = defineTopic<boolean>();
defineFold(tetherDisabledChanged, [floatingControls], (controls, disabled) => {
  controls.tetherDisabled = disabled;
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

/**
 * The tether-behavior group changed. Carries the whole selection rather
 * than one flag: the cards report their new set as a unit, and folding
 * it wholesale keeps the group and the store from drifting apart.
 */
export const behaviorsChanged = defineTopic<readonly TetherBehavior[]>();
defineFold(behaviorsChanged, [floatingControls], (controls, behaviors) => {
  for (const feature of TETHER_FEATURES) {
    controls.features[feature] = behaviors.includes(feature);
  }

  controls.clampToAvailable = behaviors.includes('clamp');
});

/** How the tether's flip pass is configured changed. */
export const flipModeChanged = defineTopic<FlipMode>();
defineFold(flipModeChanged, [floatingControls], (controls, mode) => {
  controls.flipMode = mode;
});

/**
 * Every control put back to its default.
 *
 * `tetherDisabled` is restored here too, but the durable copy is cleared
 * separately by `resetControlsSaga`; both land on the same value, so the
 * echo that follows confirms what the fold already wrote.
 */
export const controlsReset = defineTopic();
defineFold(controlsReset, [floatingControls], (controls) => {
  Object.assign(controls, defaults());
});
