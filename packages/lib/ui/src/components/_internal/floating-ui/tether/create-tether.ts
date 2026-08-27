import { createEffect, onCleanup, type Accessor } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import {
  autoUpdate,
  computePosition,
  type ReferenceElement,
} from '@floating-ui/dom';
import {
  buildMiddleware,
  type TetherConfig,
  type TetherData,
} from './middleware';
import { snapToPixel } from './pixels';
import {
  fromPlacement,
  toPlacement,
  type FloatingPlacement,
  type FloatingPoint,
} from './placement';

/**
 * The tether: the progressive-enhancement half of the floating
 * primitive. The pure-CSS placement gets the floating element onto the
 * right side of its anchor with no JavaScript at all; the tether
 * watches the boxes involved and, once it can measure them, reports a
 * resolved placement that dodges whatever is clipping them.
 *
 * This module owns only the reactive glue — keep `@floating-ui/dom`
 * fed by `autoUpdate` and stream its answers into a store. It never
 * touches the DOM beyond measuring, so the container stays the single
 * writer.
 *
 * Coordinates come back relative to the floating element's offset
 * parent — the anchor, since the container is absolutely positioned
 * inside it. That is exactly the space the CSS placement already works in, so
 * the tether's answer slots straight into a `translate` without a
 * second frame of reference.
 */

/**
 * A resolved placement, streamed field by field. Every group is `null`
 * until the pass that fills it runs, and `placement === null` is the
 * whole progressive-enhancement contract: nothing has been measured, so
 * the pure-CSS placement stands.
 */
export interface TetherState {
  /** Resolved placement after collision handling. */
  placement: FloatingPlacement | null;
  /** Where to move the floating element, in px from the anchor's box. */
  translate: FloatingPoint | null;
  /** `transform-origin` aimed back at the anchor, for scale animations. */
  transformOrigin: string | null;
  /** The anchor as measured, for size matching and detachment. */
  anchor: {
    width: number;
    height: number;
    /** Whether the anchor has been clipped out of view. */
    hidden: boolean;
  } | null;
  /** Arrow seating. `null` when no arrow is being positioned. */
  arrow: {
    /**
     * Offset from the floating element's leading edge, along the edge
     * the arrow sits on, in px.
     */
    offset: number;
    /** Whether the arrow can no longer reach the anchor's center. */
    hidden: boolean;
  } | null;
  /** Room the floating element has inside the boundary, in px. */
  available: { width: number; height: number } | null;
}

/** Nothing measured: the pure-CSS placement is in charge. */
const IDLE: TetherState = {
  placement: null,
  translate: null,
  transformOrigin: null,
  anchor: null,
  arrow: null,
  available: null,
};

/**
 * A zero-size anchor pinned to a point inside the real one. Sizing it
 * to nothing is what keeps point-mode semantics identical to edge mode:
 * `start` puts the floating element's leading edge on the point, `end`
 * its trailing edge, `center` straddles it.
 */
const pointReference = (
  anchor: HTMLElement,
  point: FloatingPoint,
): ReferenceElement => ({
  contextElement: anchor,
  getBoundingClientRect: () => {
    const box = anchor.getBoundingClientRect();
    const left = box.left + point.x;
    const top = box.top + point.y;

    return {
      x: left,
      y: top,
      width: 0,
      height: 0,
      top,
      left,
      right: left,
      bottom: top,
    };
  },
});

/** The element (or virtual element) the placement resolves against. */
const referenceFor = (config: TetherConfig): ReferenceElement =>
  config.point ? pointReference(config.anchor, config.point) : config.anchor;

/** Run one placement pass and flatten it into state. */
const resolve = async (config: TetherConfig): Promise<TetherState> => {
  const { x, y, placement, middlewareData } = await computePosition(
    referenceFor(config),
    config.floating,
    {
      strategy: 'absolute',
      placement: toPlacement(config.placement),
      middleware: buildMiddleware(config),
    },
  );

  const data: TetherData = middlewareData;
  const seat = data.arrow;

  return {
    placement: fromPlacement(placement),
    translate: { x: snapToPixel(x), y: snapToPixel(y) },
    transformOrigin: data.transformOrigin?.origin ?? null,
    anchor: data.anchorSize
      ? { ...data.anchorSize, hidden: data.hide?.referenceHidden ?? false }
      : null,
    arrow: seat
      ? {
          offset: snapToPixel(seat.x ?? seat.y ?? 0),
          hidden: seat.centerOffset !== 0,
        }
      : null,
    available: data.availableSpace ?? null,
  };
};

/**
 * Watch a floating element and stream resolved placements for it. Every
 * element involved rides in through the config — the tether never
 * queries the DOM for structure.
 *
 * The returned store is idle ({@link IDLE}) until the first pass lands,
 * and stays idle for as long as the config is `null`.
 */
export const createTether = (
  config: Accessor<TetherConfig | null>,
): TetherState => {
  const [state, setState] = createStore<TetherState>({ ...IDLE });

  createEffect(() => {
    const current = config();

    if (!current) {
      setState(reconcile(IDLE));
      return;
    }

    // A pass is async, so answers can land out of order — or after the
    // config they were measured for is gone. Only the newest run may
    // write, and cleanup parks the counter somewhere no run can match.
    let latest = 0;

    const update = () => {
      const run = ++latest;

      void resolve(current).then((next) => {
        if (run === latest) setState(reconcile(next));
      });
    };

    const stop = autoUpdate(referenceFor(current), current.floating, update);

    onCleanup(() => {
      latest = -1;
      stop();
      setState(reconcile(IDLE));
    });
  });

  return state;
};
