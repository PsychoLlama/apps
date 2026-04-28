/**
 * CSS custom properties shared across TextField's per-size styles.
 *
 * The size variant assigns these on the root; the input and slot styles
 * read them so a single size selector reaches every part without nested
 * class selectors.
 */

import { createVar } from '@vanilla-extract/css';

export const inputHeight = createVar();
export const inputBorderRadius = createVar();
export const inputPaddingX = createVar();
export const slotGap = createVar();
