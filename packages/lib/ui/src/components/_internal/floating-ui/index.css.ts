/**
 * The primitive's stylesheet, one module per layer. Mirrors `index.ts`:
 * consumers reach the styles through this barrel, the layers import each
 * other's modules directly.
 */

export { root } from './root.css';
export { window, arrowRadiusOffset } from './window.css';
export { sideOffset, alignOffset, pointX, pointY } from './window.css';
export { body, bodyRadius } from './body.css';
export { arrow, offset } from './arrow.css';
