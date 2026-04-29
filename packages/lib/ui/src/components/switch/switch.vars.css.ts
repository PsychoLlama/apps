/**
 * CSS custom properties shared across Switch's per-size styles.
 *
 * The size variant assigns these on the root; the track (`::before`) and
 * thumb styles read them so a single size selector reaches every part
 * without nested class selectors.
 */

import { createVar } from '@vanilla-extract/css';

export const trackHeight = createVar();
export const trackWidth = createVar();
export const trackBorderRadius = createVar();
export const thumbInset = createVar();
export const thumbSize = createVar();
export const thumbTranslateX = createVar();
