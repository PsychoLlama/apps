import { style } from '@vanilla-extract/css';

/**
 * The peer's name as the page's title. A local name has no length limit and
 * nothing obliges it to contain a space, so the heading breaks mid-word rather
 * than letting one long name widen the page and squeeze the controls beside
 * it.
 */
export const name = style({
  overflowWrap: 'anywhere',
});

/**
 * The name, when it's the button that renames it.
 *
 * Every override is against the button's own defaults, and `&&` doubles the
 * class specificity so they land regardless of stylesheet order. A button
 * sets its own type step, which is the right thing everywhere except here:
 * the label is the page's title, so the type it's set in belongs to the
 * heading around it rather than to the control's size scale.
 *
 * The rest is what a button does to a line of text that a title shouldn't
 * have done to it: centre it, and refuse to break it. A name may be longer
 * than the column and has no obligation to contain a space, so it wraps here
 * the same way the plain heading does.
 *
 * The gutter needs no help. Ghost already retracts its own inline padding
 * back out of the layout box, so the name starts where every other line on
 * the page starts and the padding is only the slack around the tap.
 */
export const rename = style({
  selectors: {
    '&&': {
      fontSize: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      letterSpacing: 'inherit',
      textAlign: 'left',
      whiteSpace: 'normal',
    },
  },
});

/**
 * Forget, beside the name. It opts out of the flex default of shrinking to
 * fit: the label is the whole control, so a narrow screen has to wrap the
 * heading — which it can, mid-word — rather than squeeze one word onto three
 * lines.
 */
export const actions = style({
  flexShrink: 0,
});
