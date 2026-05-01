import { styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';

export const padding = styleVariants(space, (value) => ({ padding: value }));

export const paddingX = styleVariants(space, (value) => ({
  paddingInline: value,
}));

export const paddingY = styleVariants(space, (value) => ({
  paddingBlock: value,
}));

export const paddingTop = styleVariants(space, (value) => ({
  paddingTop: value,
}));

export const paddingRight = styleVariants(space, (value) => ({
  paddingRight: value,
}));

export const paddingBottom = styleVariants(space, (value) => ({
  paddingBottom: value,
}));

export const paddingLeft = styleVariants(space, (value) => ({
  paddingLeft: value,
}));
