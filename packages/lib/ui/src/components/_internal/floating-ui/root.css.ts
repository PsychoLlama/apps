import { style, styleVariants } from '@vanilla-extract/css';
import { pointerEvents } from './body.css';

/**
 * The positioning context every window below the root places against.
 *
 * Also defaults the vars a component overrides. A component's own rule
 * wins from anywhere below the root, and on the root itself by source
 * order: every stylesheet that overrides one imports this one.
 */
const rootBase = style({
  position: 'relative',
  vars: { [pointerEvents]: 'auto' },
});

/**
 * How the root wrapper sits in the surrounding flow. Both modes
 * shrink-wrap so the wrapper's box stays the anchored element's box —
 * a stretched wrapper would put its own edges where the anchor's should
 * be, and the placement binds to the wrapper.
 */
export const root = styleVariants({
  block: [rootBase, { width: 'fit-content' }],
  inline: [rootBase, { display: 'inline-block' }],
});
