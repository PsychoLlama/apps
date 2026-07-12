/**
 * The tether's decision plugins. There is no default set — a tethered
 * surface passes exactly the plugins it cares about, in fold order.
 * The order mirrors Radix middleware: placement fallbacks resolve
 * first (`positionTry`), then the cross-axis correction (`shift`), and
 * everything downstream reads the resolved placement (`size`, `arrow`,
 * `transformOrigin`).
 */

export { arrow } from './arrow';
export { positionTry, type PositionTryFallback } from './position-try';
export { shift } from './shift';
export { size } from './size';
export { transformOrigin } from './transform-origin';
