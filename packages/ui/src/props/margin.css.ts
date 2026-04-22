import { styleVariants } from '@vanilla-extract/css';
import { space } from '@psychollama/design';

export const margin = styleVariants(space, (value) => ({ margin: value }));

export const marginX = styleVariants(space, (value) => ({
  marginLeft: value,
  marginRight: value,
}));

export const marginY = styleVariants(space, (value) => ({
  marginTop: value,
  marginBottom: value,
}));
