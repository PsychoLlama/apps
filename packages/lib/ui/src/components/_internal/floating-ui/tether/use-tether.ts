import { onCleanup, type Accessor } from 'solid-js';
import { assert } from '@lib/assert';
import { useFloatingContext } from '../context';
import { useAutoUpdate } from './use-auto-update';
import {
  useComputePosition,
  type ComputePositionInputs,
  type ComputePositionResult,
} from './use-compute-position';
import { useMiddleware, type MiddlewareInputs } from './use-middleware';

/**
 * Inputs to {@link useTether}: everything the hooks it groups need.
 * Field docs live on the hooks that read them.
 */
export interface TetherInputs
  extends Omit<ComputePositionInputs, 'middleware'>, MiddlewareInputs {}

/**
 * Where a floating window ended up, as the rest of the tree sees it.
 *
 * Accessors rather than values: the placement re-resolves as the page
 * moves, and a reader that only wants the side shouldn't wake for a
 * measurement that landed on the same one.
 */
export type TetherState = Omit<ComputePositionResult, 'compute'>;

/**
 * Read where the floating window under the nearest floating root
 * landed: the side and alignment it resolved to, and the measurement
 * behind them.
 *
 * `undefined` until the window publishes, which is the honest answer
 * and not a placement to paint with. A root whose window hasn't
 * rendered yet and a root that will never have one look the same from
 * here, and both mean the same thing: nobody has landed anywhere, so
 * the only placement going is the one the reader asked for. Readers
 * fall back to their own request rather than to a house default —
 * that's what keeps the answer from changing under them when the
 * window finally does publish.
 *
 * `measurement()` is the tethered flag as much as the data: `undefined`
 * means the placement is the one that was asked for rather than one
 * that was measured. The boxes it was taken from come with it, under
 * `measurement()?.middlewareData.boxes`, for a reader that needs the
 * anchor's extent rather than only the side it landed on.
 *
 * Throws outside a floating root, for the reason `useAnchorElement`
 * does: there's no floating anything to report on.
 */
export const useTetherState = (): Accessor<TetherState | undefined> => {
  const [state] = useFloatingContext().tether;

  return state;
};

/**
 * Keep a floating subject measured against its anchor for as long as
 * both exist: assembles the middleware, re-measures on every change that
 * can move the two apart, and publishes the resolved placement alongside
 * the raw measurement to the root's tether slot.
 *
 * Nothing here is new. It's `useMiddleware` feeding `useComputePosition`
 * with `useAutoUpdate` pulling the trigger, wired once so the window
 * calls one hook. Turning the measurement into styles is the window's
 * job.
 *
 * It returns nothing on purpose. The window is one reader of its own
 * placement among several — the surface inside it, the component around
 * it — so the answer goes to the one place they can all reach, and the
 * window reads it back through {@link useTetherState} like everyone
 * else.
 *
 * One window to a root, because a root anchors one, and the slot holds
 * one. A second window has nowhere to report and would leave the first
 * reading the second's placement as its own, so it throws instead.
 * Roots nest — a window may hold a root of its own — and each level
 * keeps its own slot, so the inner one shadows the outer rather than
 * competing for it.
 *
 * There's no off switch because none is needed: withhold either element
 * and the tether is inert, publishing the requested placement the CSS
 * paints. A caller that wants the no-JS picture on demand passes
 * `undefined` for the subject.
 *
 * ```ts
 * const side = () => props.side ?? DEFAULT_SIDE;
 *
 * useTether({ anchor, subject, side, ... });
 *
 * // The same fallback the tether was handed, so the answer can't
 * // change shape when the window publishes.
 * const state = useTetherState();
 * const resolvedSide = () => state()?.side() ?? side();
 * ```
 */
export const useTether = (inputs: TetherInputs): void => {
  // The tether state's write half. It's in the root's context, but this
  // is the only reader of it, so a root can't be told a placement by
  // anything that isn't the thing being placed. Everyone else gets the
  // getter through `useTetherState`.
  const [published, publish] = useFloatingContext().tether;
  const middleware = useMiddleware(inputs);

  const computePosition = useComputePosition({
    anchor: inputs.anchor,
    subject: inputs.subject,
    side: inputs.side,
    align: inputs.align,
    middleware,
  });

  useAutoUpdate({
    anchor: inputs.anchor,
    subject: inputs.subject,
    onUpdate: () => void computePosition.compute(),
  });

  assert(!published(), 'A <FloatingRoot> holds at most one <FloatingWindow>.');

  publish({
    side: computePosition.side,
    align: computePosition.align,
    measurement: computePosition.measurement,
  });

  // Empties the slot when the window goes, which is also what lets the
  // next one claim it.
  onCleanup(() => publish(undefined));
};
