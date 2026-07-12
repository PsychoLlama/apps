import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';
import type { TetherPlacement, TetherRect } from './geometry';
import {
  runTether,
  type AppliedDecisions,
  type TetherDecisions,
  type TetherPlugin,
  type TetherState,
} from './pipeline';
import { arrow } from './plugins/arrow';
import { flip } from './plugins/flip';
import { shift } from './plugins/shift';
import { size } from './plugins/size';
import { transformOrigin } from './plugins/transform-origin';

/**
 * The tether's reactive shell: watch the boxes that placement depends
 * on, run the decision pipeline when any of them move, and expose the
 * result as a signal. It never touches the DOM — the container merges
 * decisions over its own props, keeping a single writer.
 *
 * Observation is deliberately scroll-listener-free: `ResizeObserver`
 * catches the boxes changing size, and an `IntersectionObserver` with
 * fine-grained thresholds catches scroll carrying the surface or its
 * anchor toward a viewport edge — the only scroll positions collision
 * decisions care about. In environments without the observers (jsdom,
 * pre-hydration) the signal stays `null` and the pure-CSS placement
 * stands, which is the progressive-enhancement contract.
 */

/** Consumer-facing tuning knobs for a tethered container. */
export interface TetherOptions {
  /**
   * Clearance to keep between the surface and the viewport edge when
   * flipping, shifting, and sizing, in px. Defaults to `0`.
   */
  padding?: number;
  /**
   * The decision pipeline, folded left. Defaults to
   * {@link DEFAULT_PLUGINS}.
   */
  plugins?: readonly TetherPlugin[];
}

/** Everything a tether run needs; `null` disables the tether. */
export interface TetherConfig extends TetherOptions {
  /** The floating container element (the positioning shell). */
  popup: HTMLElement;
  /** Requested placement before any collision decisions. */
  placement: TetherPlacement;
}

/**
 * The standard pipeline, mirroring Radix's middleware order: shift
 * and flip act on independent axes (cross and main respectively), and
 * everything downstream reads their resolved placement.
 */
export const DEFAULT_PLUGINS: readonly TetherPlugin[] = [
  shift,
  flip,
  size,
  arrow,
  transformOrigin,
];

/**
 * Intersection thresholds every 5%, so scroll near a viewport edge
 * produces a steady stream of recompute signals while scroll in the
 * middle of the viewport produces none at all.
 */
const THRESHOLDS = Array.from({ length: 21 }, (_item, step) => step / 20);

const toRect = (rect: DOMRect): TetherRect => ({
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
});

const decisionsEqual = (
  before: TetherDecisions | null,
  after: TetherDecisions,
): boolean =>
  before !== null &&
  (Object.keys(after) as (keyof TetherDecisions)[]).every(
    (key) => before[key] === after[key],
  );

/**
 * Watch a floating container and stream placement decisions for it.
 * The anchor is discovered structurally — it's the container's
 * `offsetParent`, the `position: relative` element the CSS placement
 * resolves against — and the arrow, when present, is the container's
 * first-child SVG.
 *
 * Returns `null` until a run completes (or forever, where observers
 * don't exist); `null` means "the pure-CSS placement stands".
 */
export const createTether = (
  config: Accessor<TetherConfig | null>,
): Accessor<TetherDecisions | null> => {
  const [decisions, setDecisions] = createSignal<TetherDecisions | null>(null);

  createEffect(() => {
    const current = config();
    if (!current) {
      setDecisions(null);
      return;
    }

    // No observers, no enhancement: the base CSS placement stands.
    if (
      typeof ResizeObserver === 'undefined' ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const { popup } = current;
    const anchor = popup.offsetParent;
    if (!(anchor instanceof HTMLElement)) return;
    const parent =
      anchor.offsetParent instanceof HTMLElement
        ? anchor.offsetParent
        : document.documentElement;

    // The decisions currently painted, so measurements contaminated by
    // them (the arrow's seat) can be normalized back to rest. Before
    // the first run, the painted placement is the raw request.
    const toApplied = (
      painted: TetherDecisions | null,
      placement: TetherPlacement,
    ): AppliedDecisions =>
      painted
        ? {
            side: painted.side,
            align: painted.align,
            arrowShiftX: painted.arrowShiftX,
            arrowShiftY: painted.arrowShiftY,
          }
        : {
            side: placement.side,
            align: placement.align,
            arrowShiftX: 0,
            arrowShiftY: 0,
          };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const measure = () => {
      // Runs inside rAF, outside any tracking scope — reading the
      // decisions signal here doesn't subscribe the effect to itself.
      const applied = toApplied(decisions(), current.placement);
      const arrowElement = popup.querySelector(':scope > svg[data-direction]');

      const state: TetherState = {
        placement: current.placement,
        anchor: toRect(anchor.getBoundingClientRect()),
        popup: toRect(popup.getBoundingClientRect()),
        parent: toRect(parent.getBoundingClientRect()),
        viewport: {
          x: 0,
          y: 0,
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
        },
        arrow: arrowElement
          ? toRect(arrowElement.getBoundingClientRect())
          : null,
        padding: current.padding ?? 0,
        applied,
      };

      const next = runTether(state, current.plugins ?? DEFAULT_PLUGINS);
      setDecisions((previous) =>
        decisionsEqual(previous, next) ? previous : next,
      );

      // A changed placement invalidates seat-dependent measurements
      // (see the arrow plugin), so run once more after it paints. The
      // follow-up resolves the same placement and schedules nothing —
      // a bounded two-pass, not a loop.
      if (next.side !== applied.side || next.align !== applied.align) {
        schedule();
      }
    };

    const resizes = new ResizeObserver(schedule);
    resizes.observe(popup);
    resizes.observe(anchor);
    resizes.observe(parent);

    const intersections = new IntersectionObserver(schedule, {
      threshold: THRESHOLDS,
    });
    intersections.observe(popup);
    intersections.observe(anchor);

    // Viewport growth can't create collisions, but it invalidates the
    // available-space vars, and observers don't see it directly.
    window.addEventListener('resize', schedule);

    schedule();

    onCleanup(() => {
      cancelAnimationFrame(frame);
      resizes.disconnect();
      intersections.disconnect();
      window.removeEventListener('resize', schedule);
      setDecisions(null);
    });
  });

  return decisions;
};
