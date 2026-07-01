import { style } from '@vanilla-extract/css';

/**
 * The share link is one long unbroken token (origin + base32 endpoint id), so
 * let it wrap mid-string rather than overflow its container.
 */
export const shareLink = style({
  overflowWrap: 'anywhere',
});
