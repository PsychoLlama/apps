import { style, styleVariants } from '@vanilla-extract/css';

/** The positioning context every window below the root places against. */
const rootBase = style({
  position: 'relative',
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
