import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

/**
 * One group in the list: the whole row is the way in. Rows are told apart
 * by a rule between them and nothing else.
 */
export const row = style({
  display: 'flex',
  textDecoration: 'none',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: space[3],
  paddingBlock: space[3],
  borderBottom: `1px solid ${neutral.solid[6]}`,
});

/** A group's name, over whatever needs saying about it. */
export const label = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[1],
  minWidth: 0,
});
