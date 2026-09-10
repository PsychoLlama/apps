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

/** What {@link useTether} resolves. See {@link ComputePositionResult}. */
export type TetherResult = Omit<ComputePositionResult, 'compute'>;

/**
 * Keep a floating subject measured against its anchor for as long as
 * both exist: assembles the middleware, re-measures on every change that
 * can move the two apart, and reports the resolved placement alongside
 * the raw measurement.
 *
 * Nothing here is new. It's `useMiddleware` feeding `useComputePosition`
 * with `useAutoUpdate` pulling the trigger, wired once so the window
 * calls one hook. Turning the measurement into styles is the window's
 * job.
 *
 * There's no off switch because none is needed: withhold either element
 * and the tether is inert, reporting the requested placement the CSS
 * paints. A caller that wants the no-JS picture on demand passes
 * `undefined` for the subject.
 *
 * ```ts
 * const tether = useTether({
 *   anchor,
 *   subject: () => (props.tether ? subject() : undefined),
 *   side: () => props.side ?? 'bottom',
 *   align: () => props.align ?? 'center',
 *   sideOffset: () => props.sideOffset ?? 0,
 *   alignOffset: () => props.alignOffset ?? 0,
 *   arrow: () => arrowElement() && { element: arrowElement(), padding },
 *   middleware: () => props.tether?.middleware ?? [],
 * });
 * ```
 */
export const useTether = (inputs: TetherInputs): TetherResult => {
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

  return {
    side: computePosition.side,
    align: computePosition.align,
    measurement: computePosition.measurement,
  };
};
