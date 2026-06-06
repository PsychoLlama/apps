import { style } from '@vanilla-extract/css';
import { accent, neutral, radius, space } from '@lib/design';

/**
 * Placeholder for the live camera feed. Square reticle with bracketed
 * corners — the canonical "aim here" framing. Swapped for the real
 * video stream once scanning logic lands.
 */
export const viewport = style({
  position: 'relative',
  width: '100%',
  maxWidth: '18rem',
  aspectRatio: '1',
  borderRadius: radius[5],
  background: neutral.solid[2],
  color: neutral.solid[8],
});

/** Faint grid icon centered behind the corner brackets. */
export const reticleIcon = style({
  color: neutral.solid[7],
});

/** Shared geometry for the four bracketed corners. */
export const corner = style({
  position: 'absolute',
  width: space[6],
  height: space[6],
  borderColor: accent.solid[9],
  borderStyle: 'solid',
});

const inset = space[4];
const thickness = '3px';

export const cornerTopLeft = style({
  top: inset,
  left: inset,
  borderTopWidth: thickness,
  borderInlineStartWidth: thickness,
  borderTopLeftRadius: radius[4],
});

export const cornerTopRight = style({
  top: inset,
  right: inset,
  borderTopWidth: thickness,
  borderInlineEndWidth: thickness,
  borderTopRightRadius: radius[4],
});

export const cornerBottomLeft = style({
  bottom: inset,
  left: inset,
  borderBottomWidth: thickness,
  borderInlineStartWidth: thickness,
  borderBottomLeftRadius: radius[4],
});

export const cornerBottomRight = style({
  bottom: inset,
  right: inset,
  borderBottomWidth: thickness,
  borderInlineEndWidth: thickness,
  borderBottomRightRadius: radius[4],
});

/** Full-bleed primary action, capped to the reticle's width. */
export const startButton = style({
  width: '100%',
  maxWidth: '18rem',
});
