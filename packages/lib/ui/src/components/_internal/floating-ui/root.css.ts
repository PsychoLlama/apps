import { style, styleVariants } from '@vanilla-extract/css';

/**
 * The root wrapper — the box a floating window positions against.
 *
 * Deliberately featureless, and that's the whole point. An absolutely
 * positioned child resolves its percentages against the nearest
 * positioned ancestor's *padding* box, so putting the positioning
 * context on the anchored element itself would place the window against
 * the inside of its border rather than its outer edge. A wrapper with no
 * border or padding of its own has one box, and it's the one consumers
 * mean when they point at the anchor.
 *
 * Consumers style the element they wrap, never this one.
 */
const rootBase = style({
  position: 'relative',
});

/**
 * How the root wrapper sits in the surrounding flow. Both modes
 * shrink-wrap: a stretched wrapper would put its own edges where the
 * anchored element's should be, and `left: 100%` would bind the window
 * to the wrong box — the same class of error the border-box collapse
 * above exists to prevent, only wider.
 *
 * Shrink-wrapping is also why the wrapper takes a `class`: it can size
 * itself to its content but can't infer that an anchor was meant to
 * stretch. That case sizes the wrapper, which now *is* the anchor's box.
 */
export const root = styleVariants({
  block: [rootBase, { display: 'block', width: 'fit-content' }],
  inline: [rootBase, { display: 'inline-block' }],
});
