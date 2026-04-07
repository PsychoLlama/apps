/**
 * CSS reset: strip UA defaults so every element starts as a blank slate.
 * Ported from "The New CSS Reset" v1.11.3 (Elad Shechter, MIT).
 * https://github.com/elad2412/the-new-css-reset
 *
 * Adapted for Vanilla Extract. No design opinions — those live in
 * globals.css.ts. All authored rules use :where() for zero specificity
 * so any component rule wins automatically.
 */
import { globalStyle } from '@vanilla-extract/css';

/**
 * Strip UA defaults except `display`. The `symbol *` exclusion fixes a
 * Firefox SVG sprite bug. `html` is excluded to avoid a Chrome bug that
 * breaks CSS hyphens.
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

/** Restore pointer cursor lost by `all: unset`. */
globalStyle(':where(a, button)', {
  cursor: 'revert',
});

/** Remove list styles (bullets/numbers). */
globalStyle(':where(ol, ul, menu, summary)', {
  listStyle: 'none',
});

/**
 * Firefox: nested ordered lists continue numbering from the parent.
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1881517
 */
globalStyle(':where(ol)', {
  counterReset: 'revert',
});

/** Prevent replaced elements from exceeding their container. */
globalStyle(':where(img)', {
  maxInlineSize: '100%',
  maxBlockSize: '100%',
});

/** Replaced/embedded elements: block display for predictable layout. */
globalStyle(':where(img, picture, video, svg, canvas)', {
  display: 'block',
});

/** Remove spacing between cells in tables. */
globalStyle(':where(table)', {
  borderCollapse: 'collapse',
});

/**
 * Safari: `user-select: none` on an ancestor breaks text input.
 * Explicitly restore auto selection for form controls.
 */
globalStyle(':where(input, textarea)', {
  WebkitUserSelect: 'auto',
});

/** Safari: restore white-space handling for textareas. */
globalStyle(':where(textarea)', {
  whiteSpace: 'revert',
});

/** Allow styling of the meter element. */
globalStyle(':where(meter)', {
  WebkitAppearance: 'revert',
  appearance: 'revert',
});

/** Preserve preformatted text semantics. */
globalStyle(':where(pre)', {
  all: 'revert',
  boxSizing: 'border-box',
});

/** Reset default text opacity of input placeholder. */
globalStyle('::placeholder', {
  color: 'unset',
  userSelect: 'none',
});

/**
 * Fix `hidden` attribute: `display: revert` restores the element's UA
 * display value rather than the attribute's intended `none`.
 */
globalStyle(':where([hidden])', {
  display: 'none',
});

/**
 * Chromium/Safari: restore contenteditable behavior after `all: unset`.
 * Also re-enable user selection in case a wrapper disables it.
 */
globalStyle(':where([contenteditable]:not([contenteditable="false"]))', {
  MozUserModify: 'read-write',
  WebkitUserModify: 'read-write',
  overflowWrap: 'break-word',
  // @ts-expect-error -- no Vanilla Extract type for -webkit-line-break
  WebkitLineBreak: 'after-white-space',
  WebkitUserSelect: 'auto',
});

/** Restore native drag behavior (Chromium/Safari only). */
globalStyle(':where([draggable="true"])', {
  // @ts-expect-error -- no Vanilla Extract type for -webkit-user-drag
  WebkitUserDrag: 'element',
});

/** Restore native dialog modal behavior. */
globalStyle(':where(dialog:modal)', {
  all: 'revert',
  boxSizing: 'border-box',
});

/** Remove default summary disclosure marker (WebKit). */
globalStyle('::-webkit-details-marker', {
  display: 'none',
});
