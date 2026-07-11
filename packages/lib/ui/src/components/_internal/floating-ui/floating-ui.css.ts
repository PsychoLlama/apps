import { style } from '@vanilla-extract/css';

/**
 * Anchor target — establishes the positioning context an absolutely
 * positioned floating surface resolves against. Apply to whatever
 * element a floating primitive should anchor to.
 */
export const anchor = style({
  position: 'relative',
});

/** Pulls the floating surface out of flow so it floats over the anchor. */
export const container = style({
  position: 'absolute',
});
