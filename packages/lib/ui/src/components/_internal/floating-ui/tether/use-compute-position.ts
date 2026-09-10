import { createMemo, createSignal, onCleanup, type Accessor } from 'solid-js';
import {
  computePosition,
  type ComputePositionReturn,
  type FloatingElement,
  type Middleware,
  type ReferenceElement,
} from '@floating-ui/dom';
import { type FloatingAlignment, type FloatingSide } from '../types';
import { fromPlacement, toPlacement } from './placement';

/**
 * Inputs to {@link useComputePosition}.
 *
 * Every field is an accessor for the same reason the elements are in
 * `AutoUpdateInputs`: refs land after the first render, and the
 * requested placement changes as props do. Nothing here is read until
 * {@link ComputePositionResult.compute} runs, so the values are always
 * the current ones.
 */
export interface ComputePositionInputs {
  /** The anchor being positioned against. */
  anchor: Accessor<ReferenceElement | undefined>;

  /** The positioned element being measured. */
  subject: Accessor<FloatingElement | undefined>;

  /** Edge of the anchor the subject is asking to bind to. */
  side: Accessor<FloatingSide>;

  /** Placement along that edge the subject is asking for. */
  align: Accessor<FloatingAlignment>;

  /**
   * Middleware for the measurement, in order. This is what turns a
   * measurement into a decision: with none, the result is the requested
   * placement flush against the anchor. Assembled by `useMiddleware`.
   */
  middleware: Accessor<Middleware[]>;
}

/**
 * The resolved placement, plus the measurement that produces it.
 *
 * {@link side} and {@link align} report the requested placement until a
 * measurement lands, so the first paint and the no-JS path agree with
 * the CSS.
 */
export interface ComputePositionResult {
  /** Edge the subject actually binds to. Drives `data-side`. */
  side: Accessor<FloatingSide>;

  /** Placement along that edge. Drives `data-align`. */
  align: Accessor<FloatingAlignment>;

  /**
   * The latest measurement in full — the subject's `x`/`y` and every
   * middleware's `middlewareData` — or `undefined` until one lands. The
   * window reads its coordinates and the arrow's seat from here.
   */
  measurement: Accessor<ComputePositionReturn | undefined>;

  /**
   * Measure and re-resolve the placement. Wire it to `onUpdate` on
   * `useAutoUpdate`; the promise is for tests, which need to await the
   * measurement they triggered.
   */
  compute: () => Promise<void>;
}

/**
 * Resolve where a floating subject should sit against its anchor, by
 * measuring the page rather than trusting the CSS placement outright.
 *
 * The measurement is pull-based: nothing runs until
 * {@link ComputePositionResult.compute} is called, which is what lets it
 * pair with `useAutoUpdate` without either hook knowing about the other.
 *
 * ```ts
 * const { side, align, measurement, compute } = useComputePosition({
 *   anchor,
 *   subject,
 *   side: () => props.side ?? 'bottom',
 *   align: () => props.align ?? 'center',
 *   middleware,
 * });
 *
 * useAutoUpdate({ anchor, subject, onUpdate: compute });
 * ```
 *
 * The hook is the seam, not the policy. `computePosition` only moves a
 * placement when a middleware tells it to, so which constraints apply —
 * flipping, shifting, sizing — is entirely the middleware list's call.
 */
export const useComputePosition = (
  inputs: ComputePositionInputs,
): ComputePositionResult => {
  const [measurement, setMeasurement] = createSignal<ComputePositionReturn>();

  // Stamps each measurement so a slow one that resolves after a newer one
  // — or after the scope is gone — drops its result instead of clobbering
  // what replaced it.
  let generation = 0;

  onCleanup(() => void generation++);

  const compute = async () => {
    const anchor = inputs.anchor();
    const subject = inputs.subject();

    if (!anchor || !subject) return;

    const pending = ++generation;
    const result = await computePosition(anchor, subject, {
      placement: toPlacement(inputs.side(), inputs.align()),
      middleware: inputs.middleware(),
    });

    if (pending === generation) setMeasurement(result);
  };

  // The requested placement stands in until a measurement lands.
  const placement = createMemo(() =>
    fromPlacement(
      measurement()?.placement ?? toPlacement(inputs.side(), inputs.align()),
    ),
  );

  return {
    side: () => placement().side,
    align: () => placement().align,
    measurement,
    compute,
  };
};
