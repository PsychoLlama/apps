import { styleVariants } from '@vanilla-extract/css';
import { space, radius, shadow, background } from '#design';

export const p = styleVariants(space, (value) => ({ padding: value }));

export const px = styleVariants(space, (value) => ({
  paddingLeft: value,
  paddingRight: value,
}));

export const py = styleVariants(space, (value) => ({
  paddingTop: value,
  paddingBottom: value,
}));

export const bg = styleVariants({
  page: { background: background.page },
  panelSolid: { background: background.panelSolid },
  panelTranslucent: { background: background.panelTranslucent },
  surface: { background: background.surface },
});

export const r = styleVariants(radius, (value) => ({ borderRadius: value }));

export const s = styleVariants(shadow, (value) => ({ boxShadow: value }));
