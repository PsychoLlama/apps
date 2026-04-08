import { recipe } from '@vanilla-extract/recipes';
import { vars } from '~/theme/contract.css';

export const button = recipe({
  base: {
    fontFamily: vars.font.default,
    fontWeight: vars.fontWeight.medium,
    borderRadius: vars.radius[2],
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 120ms, box-shadow 120ms',
    lineHeight: 1,
    textDecoration: 'none',
    userSelect: 'none',
    ':focus-visible': {
      outline: `2px solid ${vars.accent[8]}`,
      outlineOffset: '2px',
    },
  },
  variants: {
    variant: {
      solid: {
        backgroundColor: vars.accent[9],
        color: vars.accent.contrast,
        ':hover': { backgroundColor: vars.accent[10] },
        ':active': { backgroundColor: vars.accent[10] },
      },
      soft: {
        backgroundColor: vars.accent.a3,
        color: vars.accent[11],
        ':hover': { backgroundColor: vars.accent.a4 },
        ':active': { backgroundColor: vars.accent.a5 },
      },
      outline: {
        backgroundColor: 'transparent',
        boxShadow: `inset 0 0 0 1px ${vars.accent.a7}`,
        color: vars.accent[11],
        ':hover': { backgroundColor: vars.accent.a2 },
        ':active': { backgroundColor: vars.accent.a3 },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: vars.accent[11],
        ':hover': { backgroundColor: vars.accent.a3 },
        ':active': { backgroundColor: vars.accent.a4 },
      },
    },
    size: {
      1: {
        height: vars.space[6],
        paddingLeft: vars.space[2],
        paddingRight: vars.space[2],
        fontSize: vars.fontSize[1],
        gap: vars.space[1],
      },
      2: {
        height: vars.space[7],
        paddingLeft: vars.space[3],
        paddingRight: vars.space[3],
        fontSize: vars.fontSize[2],
        gap: vars.space[2],
      },
      3: {
        height: vars.space[8],
        paddingLeft: vars.space[4],
        paddingRight: vars.space[4],
        fontSize: vars.fontSize[3],
        gap: vars.space[2],
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 2,
  },
});
