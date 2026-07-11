import { createVar, fallbackVar, style } from '@vanilla-extract/css';

/**
 * Anchor target — establishes the positioning context an absolutely
 * positioned floating surface resolves against. Apply to whatever
 * element a floating primitive should anchor to.
 */
export const anchor = style({
  position: 'relative',
});

const translateX = createVar();
const translateY = createVar();

/**
 * Positioning shell for the floating surface. `data-side` pins it to an
 * edge of the anchor; `data-justify` (inline axis) and `data-align`
 * (block axis) slide it from there, composed into a single translate so
 * the two independent attributes don't clobber one `transform`.
 */
export const container = style({
  position: 'absolute',
  transform: `translate(${fallbackVar(translateX, '0')}, ${fallbackVar(translateY, '0')})`,
  selectors: {
    // Which edge of the anchor the surface pins to.
    '&[data-side="top"]': { top: 0, left: '50%' },
    '&[data-side="bottom"]': { top: '100%', left: '50%' },
    '&[data-side="left"]': { top: '50%', left: 0 },
    '&[data-side="right"]': { top: '50%', left: '100%' },
    // Horizontal slide relative to the pin.
    '&[data-justify="start"]': { vars: { [translateX]: '0' } },
    '&[data-justify="center"]': { vars: { [translateX]: '-50%' } },
    '&[data-justify="end"]': { vars: { [translateX]: '-100%' } },
    // Vertical slide relative to the pin.
    '&[data-align="start"]': { vars: { [translateY]: '0' } },
    '&[data-align="center"]': { vars: { [translateY]: '-50%' } },
    '&[data-align="end"]': { vars: { [translateY]: '-100%' } },
  },
});
