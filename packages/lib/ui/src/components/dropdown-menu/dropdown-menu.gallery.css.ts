import { style, styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';
import { hatch } from '#gallery/style';
import type { DropdownMenuSide } from './dropdown-menu';

/**
 * The room each menu has to open into. A fixed, hatched box so the
 * boundary the tether collides with is visible. The trigger sits at the
 * top, since a menu opens downward and is taller than it is wide.
 */
export const stage = style([
  hatch,
  {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '24rem',
    height: '28rem',
    padding: space[3],
  },
]);

/**
 * For the Side listing: seats the trigger against the edge opposite the
 * side the menu opens on, so the menu has the whole box to open into
 * and doesn't flip.
 */
export const seated = styleVariants({
  top: [stage, { alignItems: 'flex-end' }],
  bottom: [stage, { alignItems: 'flex-start' }],
  left: [stage, { justifyContent: 'flex-end' }],
  right: [stage, { justifyContent: 'flex-start' }],
} satisfies Record<DropdownMenuSide, unknown>);
