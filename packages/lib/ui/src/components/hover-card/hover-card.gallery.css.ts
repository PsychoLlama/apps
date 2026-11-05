import { style, styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';
import { hatch } from '#gallery/style';
import type { HoverCardSide } from './hover-card';

/**
 * The room each card has to open into. A fixed, hatched box so the
 * boundary the tether collides with is visible.
 */
export const stage = style([
  hatch,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32rem',
    height: '20rem',
    padding: space[3],
  },
]);

/**
 * For the Side listing: seats the trigger against the edge opposite the
 * side the card opens on, so the card has the whole box to open into
 * and doesn't flip.
 */
export const seated = styleVariants({
  top: [stage, { alignItems: 'flex-end' }],
  bottom: [stage, { alignItems: 'flex-start' }],
  left: [stage, { justifyContent: 'flex-end' }],
  right: [stage, { justifyContent: 'flex-start' }],
} satisfies Record<HoverCardSide, unknown>);

/** Keeps the summary from stretching the card to its full 480px. */
export const summary = style({
  width: '18rem',
});
