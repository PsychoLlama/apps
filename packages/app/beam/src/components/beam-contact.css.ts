import { style } from '@vanilla-extract/css';

/**
 * The contact's name as the page's title. A local name has no length limit
 * and nothing obliges it to contain a space, so the heading breaks mid-word
 * rather than letting one long name widen the page.
 */
export const name = style({
  overflowWrap: 'anywhere',
});

/**
 * The endpoint key, worn as a badge. Badges are built for short status words,
 * so three of their defaults have to give: 64 hex characters with no spaces
 * need `anywhere` to break at all, `nowrap` would run them off the screen, and
 * the key is the one thing on this page worth copying, so the chrome's
 * `user-select: none` can't apply to it. `&&` doubles the class specificity to
 * win against `Badge`'s own rules regardless of stylesheet order.
 */
export const endpointId = style({
  selectors: {
    '&&': {
      // `inline-flex` sizes the badge to its content, so the key sets the
      // width and the pill grows past the column. A block box takes the
      // column's width instead and lets the text wrap inside it.
      display: 'block',
      maxWidth: '100%',
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      userSelect: 'text',
    },
  },
});
