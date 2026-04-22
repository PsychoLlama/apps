import { styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';

export const padding = styleVariants(space, (value) => ({ padding: value }));

export const paddingX = styleVariants(space, (value) => ({
  paddingLeft: value,
  paddingRight: value,
}));

export const paddingY = styleVariants(space, (value) => ({
  paddingTop: value,
  paddingBottom: value,
}));
