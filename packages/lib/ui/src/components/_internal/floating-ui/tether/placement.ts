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

/** Pack a side and alignment into an upstream {@link Placement}. */
export const toPlacement = (
  side: FloatingSide,
  align: FloatingAlignment,
): Placement => (align === 'center' ? side : `${side}-${align}`);

/** Unpack an upstream {@link Placement} back into a side and alignment. */
export const fromPlacement = (
  placement: Placement,
): { side: FloatingSide; align: FloatingAlignment } => {
  const [side, align] = placement.split('-') as [
    FloatingSide,
    FloatingAlignment?,
  ];

  return { side, align: align ?? 'center' };
};
