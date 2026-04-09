import { styleVariants } from '@vanilla-extract/css';
import { space } from '#design';

export const p = styleVariants(space, (value) => ({ padding: value }));

export const px = styleVariants(space, (value) => ({
  paddingLeft: value,
  paddingRight: value,
}));

export const py = styleVariants(space, (value) => ({
  paddingTop: value,
  paddingBottom: value,
}));
