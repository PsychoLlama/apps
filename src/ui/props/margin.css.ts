import { styleVariants } from '@vanilla-extract/css';
import { space } from '#design';

export const m = styleVariants(space, (value) => ({ margin: value }));

export const mx = styleVariants(space, (value) => ({
  marginLeft: value,
  marginRight: value,
}));

export const my = styleVariants(space, (value) => ({
  marginTop: value,
  marginBottom: value,
}));
