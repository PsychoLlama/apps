import { style } from '@vanilla-extract/css';
import {
  text,
  neutral,
  accent,
  background,
  typeScale,
  fontWeight,
  space,
  radius,
} from '#design-system';

// --- Shared ---

export const stack = {
  sm: style({ display: 'flex', flexDirection: 'column', gap: space[3] }),
  md: style({ display: 'flex', flexDirection: 'column', gap: space[5] }),
  lg: style({ display: 'flex', flexDirection: 'column', gap: space[6] }),
};

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[4],
});

export const label = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  letterSpacing: typeScale[1].letterSpacing,
  color: text.lowContrast,
  marginBottom: space[1],
});

export const heading = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.highContrast,
  marginBottom: space[2],
});

export const sampleText = style({
  color: text.highContrast,
});

export const muted = style({
  opacity: 0.6,
});

// --- Colors ---

export const scaleGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: space[1],
});

export const swatch = style({
  height: space[8],
  borderRadius: radius[3],
});

export const checkerboard = style({
  backgroundImage: [
    `linear-gradient(45deg, ${neutral[3]} 25%, transparent 25%)`,
    `linear-gradient(-45deg, ${neutral[3]} 25%, transparent 25%)`,
    `linear-gradient(45deg, transparent 75%, ${neutral[3]} 75%)`,
    `linear-gradient(-45deg, transparent 75%, ${neutral[3]} 75%)`,
  ].join(', '),
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
});

export const swatchOverlay = style({
  width: '100%',
  height: '100%',
  borderRadius: radius[3],
});

export const swatchLabel = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  textAlign: 'center',
  marginTop: space[1],
  color: text.lowContrast,
});

export const textSwatch = style({
  width: space[8],
  height: space[8],
  borderRadius: radius[3],
});

export const textSample = style({
  fontSize: typeScale[5].fontSize,
  lineHeight: typeScale[5].lineHeight,
  letterSpacing: typeScale[5].letterSpacing,
});

export const bgRow = style({
  display: 'grid',
  gridTemplateColumns: `${space[9]} 1fr`,
  gap: space[4],
  alignItems: 'center',
});

export const bgSwatch = style({
  aspectRatio: '2 / 1',
  borderRadius: radius[3],
  border: `1px solid ${neutral[6]}`,
});

export const bgLabel = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  color: text.highContrast,
});

// --- Typography ---

export const typeSample = style({
  fontSize: typeScale[6].fontSize,
  lineHeight: typeScale[6].lineHeight,
  letterSpacing: typeScale[6].letterSpacing,
  color: text.highContrast,
});

// --- Spacing ---

export const spacingGrid = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: `${space[3]} ${space[4]}`,
  alignItems: 'center',
});

export const spacingLabel = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  color: text.lowContrast,
});

export const spacingBar = style({
  height: space[5],
  backgroundColor: accent[9],
  borderRadius: radius[1],
});

// --- Radius ---

export const radiusGrid = style({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, ${space[9]})`,
  gap: space[5],
  alignItems: 'end',
});

export const radiusItem = style({
  textAlign: 'center',
});

export const radiusBox = style({
  aspectRatio: '1',
  backgroundColor: accent[9],
});

export const radiusLabel = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  marginTop: space[2],
  color: text.lowContrast,
});

// --- Shadows ---

export const shadowGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: space[6],
  padding: space[6],
});

export const shadowCard = style({
  aspectRatio: '3 / 2',
  backgroundColor: background.panelSolid,
  borderRadius: radius[4],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const shadowLabel = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  color: text.lowContrast,
});

export const shadowCaption = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  color: text.lowContrast,
  marginTop: space[2],
});

// --- Breakpoints ---

export const table = style({
  borderCollapse: 'collapse',
  width: '100%',
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
});

export const th = style({
  textAlign: 'left',
  padding: `${space[3]} ${space[4]}`,
  borderBottom: `1px solid ${neutral[6]}`,
  color: text.lowContrast,
  fontWeight: fontWeight.medium,
});

export const td = style({
  padding: `${space[3]} ${space[4]}`,
  borderBottom: `1px solid ${neutral[4]}`,
  color: text.highContrast,
  fontWeight: fontWeight.medium,
});

export const tdMono = style({
  padding: `${space[3]} ${space[4]}`,
  borderBottom: `1px solid ${neutral[4]}`,
  color: text.lowContrast,
  fontFamily: 'monospace',
});
