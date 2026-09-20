/**
 * The primitive's stylesheet, one module per layer. Mirrors `index.ts`:
 * consumers reach the styles through this barrel, the layers import each
 * other's modules directly.
 */

export { root } from './root.css';
export { window, radiusVariants } from './window.css';
export { sideOffset, alignOffset, pointX, pointY } from './window.css';
export { body, borderRadius, pointerEvents } from './body.css';
export {
  arrow,
  offset,
  base as arrowBase,
  depth as arrowDepth,
  translateX as arrowX,
  translateY as arrowY,
} from './arrow.css';
