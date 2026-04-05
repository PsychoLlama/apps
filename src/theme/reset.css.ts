import { globalStyle } from '@vanilla-extract/css';

/** Disable double-tap zoom for faster tap response on touch devices. */
globalStyle(':root', {
  touchAction: 'manipulation',
  WebkitFontSmoothing: 'antialiased',
});

/** Use border-box everywhere so padding doesn't expand elements. */
globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});

/** Full-height column layout with no default margin. */
globalStyle('body', {
  margin: 0,
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
});

/** Block-level media elements that respect container width. */
globalStyle('img, picture, video, svg, canvas', {
  display: 'block',
  maxWidth: '100%',
});
