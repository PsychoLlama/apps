/**
 * The tether's decision plugins. There is no default set — a tethered
 * surface passes exactly the plugins it cares about, in fold order.
 *
 * Only `positionTry` (placement fallbacks) lives here today. The
 * cross-axis, sizing, arrow, and transform-origin stages were pulled
 * out while the core structure settles and will return as the pipeline
 * grows back.
 */

export { positionTry, type PositionTryFallback } from './position-try';
