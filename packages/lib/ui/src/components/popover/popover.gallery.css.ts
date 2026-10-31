import { style, styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';
import { hatch } from '#gallery/style';
import type { PopoverSide } from './popover';

/**
 * The room each popover has to open into. A fixed, hatched box so the
 * boundary the tether collides with is visible.
 */
export const stage = style([
  hatch,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24rem',
    height: '16rem',
    padding: space[3],
  },
]);

/**
 * For the Side listing: seats the trigger against the edge opposite the
 * side the popover opens on, so the panel has the whole box to open into
 * and doesn't flip.
 */
export const seated = styleVariants({
  top: [stage, { alignItems: 'flex-end' }],
  bottom: [stage, { alignItems: 'flex-start' }],
  left: [stage, { justifyContent: 'flex-end' }],
  right: [stage, { justifyContent: 'flex-start' }],
} satisfies Record<PopoverSide, unknown>);
