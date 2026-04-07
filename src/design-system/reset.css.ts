import { globalStyle } from '@vanilla-extract/css';

/**
 * Aggressive reset: strip UA defaults so every element starts as a blank slate.
 * :where() gives zero specificity — any authored rule wins automatically.
 * `display: revert` restores the UA default display value (block for div,
 * inline for span, etc.) since `all: unset` collapses everything to inline.
 *
 * Excluded: html (root context), replaced/embedded elements, SVG internals.
 * Inspired by "The New CSS Reset" (Elad Shechter).
 */
globalStyle(
  '*:where(:not(html, iframe, canvas, img, svg, video, audio):not(svg *, symbol *))',
  {
    all: 'unset',
    display: 'revert',
  },
);

/** Border-box sizing on everything, including pseudo-elements. */
globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});

/** Replaced/embedded elements: block display, respect container width. */
globalStyle('img, picture, video, svg, canvas', {
  display: 'block',
  maxWidth: '100%',
});

/** Placeholder text is not real content — prevent selection. */
globalStyle('::placeholder', {
  userSelect: 'none',
});
