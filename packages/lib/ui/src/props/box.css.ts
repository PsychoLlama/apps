import { styleVariants } from '@vanilla-extract/css';
import { radius, shadow, background } from '@lib/design';

export const bg = styleVariants({
  page: { background: background.page },
  panelSolid: { background: background.panelSolid },
  panelTranslucent: { background: background.panelTranslucent },
  surface: { background: background.surface },
});

export const radiusVariants = styleVariants(radius, (value) => ({
  borderRadius: value,
}));

export const shadowVariants = styleVariants(shadow, (value) => ({
  boxShadow: value,
}));
