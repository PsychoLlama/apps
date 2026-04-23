/**
 * CSS custom properties shared between Card and Inset.
 *
 * Card assigns them per `size`. Inset reads them to derive the negative
 * margins that let its content escape Card padding while still tracking
 * the active size.
 */

import { createVar } from '@vanilla-extract/css';

export const cardPaddingTop = createVar();
export const cardPaddingRight = createVar();
export const cardPaddingBottom = createVar();
export const cardPaddingLeft = createVar();
export const cardBorderRadius = createVar();
