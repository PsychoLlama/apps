import { type Placement } from '@floating-ui/dom';
import { type FloatingAlignment, type FloatingSide } from '../types';

/**
 * Translation between our placement vocabulary and `@floating-ui/dom`'s.
 *
 * The two disagree on one point: upstream spells a centered window as
 * the bare side (`'bottom'`) and only suffixes start/end, while ours
 * names all three. So `center` is the value that disappears crossing
 * into the library and reappears coming back.
 */

/**
 * The placement a window binds to when it asks for nothing.
 *
 * The one definition of it, and it belongs to the window: the window
 * folds these into what it hands the tether and into what it falls back
 * to, so the two can't drift. Nothing reading the tether state applies
 * them — an unpublished slot reports nothing at all rather than a
 * placement nobody chose.
 */
export const DEFAULT_SIDE: FloatingSide = 'bottom';

/** @see {@link DEFAULT_SIDE} */
export const DEFAULT_ALIGN: FloatingAlignment = 'center';

/** Pack a side and alignment into an upstream {@link Placement}. */
export const toPlacement = (
  side: FloatingSide,
  align: FloatingAlignment,
): Placement => (align === 'center' ? side : `${side}-${align}`);

/** Unpack an upstream {@link Placement} back into a side and alignment. */
export const fromPlacement = (
  placement: Placement,
): { side: FloatingSide; align: FloatingAlignment } => {
  const [side, align = DEFAULT_ALIGN] = placement.split('-') as [
    FloatingSide,
    FloatingAlignment?,
  ];

  return { side, align };
};
