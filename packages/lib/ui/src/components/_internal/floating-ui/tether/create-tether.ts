import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';
import type { TetherPlacement, TetherRect } from './geometry';
import {
  runTether,
  type AppliedDecisions,
  type TetherDecisions,
  type TetherPlugin,
  type TetherState,
} from './pipeline';

/**
 * The tether's reactive shell: watch the boxes that placement depends
 * on, run the decision pipeline when any of them move, and expose the
 * result as a signal. It never touches the DOM beyond measuring the
 * elements it was handed — the container merges decisions over its own
 * props, keeping a single writer.
 *
 * Observation: `ResizeObserver` catches the boxes changing size, and a
 * capture-phase passive scroll listener catches any scroll container
 * in the ancestry carrying the anchor. Both funnel into one
 * rAF-batched measure, so a per-pixel scroll stream costs at most one
 * pipeline run per frame. In environments without `ResizeObserver`
 * (jsdom, pre-hydration) the signal stays `null` and the pure-CSS
 * placement stands, which is the progressive-enhancement contract.
 */

/** Consumer-facing tuning knobs for a tethered container. */
export interface TetherOptions {
  /**
   * Clearance to keep between the surface and the viewport edge when
   * flipping, shifting, and sizing, in px. Defaults to `0`.
   */
  padding?: number;
  /**
   * The decision pipeline, folded left. There are no defaults — pass
   * exactly the plugins the surface cares about.
   */
  plugins: readonly TetherPlugin[];
}

/** Everything a tether run needs; `null` disables the tether. */
export interface TetherConfig extends TetherOptions {
  /** The floating container element (the positioning shell). */
  popup: HTMLElement;
  /** The anchor element the placement resolves against. */
  anchor: HTMLElement;
  /** The pointer arrow, when one is rendered. */
  arrow?: SVGSVGElement | null;
  /** Requested placement before any collision decisions. */
  placement: TetherPlacement;
}

/**
 * The viewport in the coordinate space `getBoundingClientRect` reports
 * (the layout viewport). `visualViewport` narrows it to what's really
 * visible — pinch zoom and on-screen keyboards. Display cutouts need
 * no handling here: the layout viewport only extends under them when a
 * page opts into `viewport-fit=cover`, which this design never does.
 */
const measureViewport = (): TetherRect => {
  const visual = window.visualViewport;

  return visual
    ? {
        x: visual.offsetLeft,
        y: visual.offsetTop,
        width: visual.width,
        height: visual.height,
      }
    : {
        x: 0,
        y: 0,
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      };
};

const toRect = (rect: DOMRect): TetherRect => ({
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
});

/**
 * Value equality for the decisions signal. Every pipeline run builds a
 * fresh record from pure plugins, so subscriber stability comes from
 * the signal comparing by value rather than reference.
 */
const sameDecisions = (
  before: TetherDecisions | null,
  after: TetherDecisions | null,
): boolean =>
  before === after ||
  (before !== null &&
    after !== null &&
    (Object.keys(after) as (keyof TetherDecisions)[]).every(
      (key) => before[key] === after[key],
    ));

/**
 * Watch a floating container and stream placement decisions for it.
 * Every element involved rides in through the config — the tether
 * never queries the DOM for structure.
 *
 * Returns `null` until a run completes (or forever, where observers
 * don't exist); `null` means "the pure-CSS placement stands".
 */
export const createTether = (
  config: Accessor<TetherConfig | null>,
): Accessor<TetherDecisions | null> => {
  const [decisions, setDecisions] = createSignal<TetherDecisions | null>(null, {
    equals: sameDecisions,
  });

  createEffect(() => {
    const current = config();
    if (!current) {
      setDecisions(null);
      return;
    }

    // No observers, no enhancement: the base CSS placement stands.
    if (typeof ResizeObserver === 'undefined') return;

    const { popup, anchor, arrow } = current;

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

      const state: TetherState = {
        placement: current.placement,
        rects: {
          anchor: toRect(anchor.getBoundingClientRect()),
          popup: toRect(popup.getBoundingClientRect()),
          viewport: measureViewport(),
          arrow: arrow ? toRect(arrow.getBoundingClientRect()) : null,
        },
        padding: current.padding ?? 0,
        applied,
      };

      const next = runTether(state, current.plugins);
      setDecisions(next);

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

    // Scroll anywhere in the ancestry moves the anchor relative to the
    // viewport. Capture sees every scroll container without naming
    // them; passive keeps the listener off the scroll critical path.
    document.addEventListener('scroll', schedule, {
      capture: true,
      passive: true,
    });

    // Viewport changes invalidate the collision box and the
    // available-space vars: the window itself, and the visual viewport
    // moving independently (pinch zoom, on-screen keyboards).
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);

    schedule();

    onCleanup(() => {
      cancelAnimationFrame(frame);
      resizes.disconnect();
      document.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      setDecisions(null);
    });
  });

  return decisions;
};
