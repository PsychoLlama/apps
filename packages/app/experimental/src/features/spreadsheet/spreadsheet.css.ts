import { style } from '@vanilla-extract/css';
import {
  accent,
  background,
  danger,
  fontFamily,
  fontWeight,
  moderate,
  neutral,
  radius,
  space,
  standard,
  typeScale,
} from '@lib/design';

export const shell = style({
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
});

export const body = style({
  padding: space[5],
  gap: space[5],
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
});

// --- Sheet grid ---

export const sheetCard = style({
  backgroundColor: background.panelSolid,
  border: `1px solid ${neutral.solid[6]}`,
  borderRadius: radius[4],
  overflow: 'hidden',
});

export const sheetScroll = style({
  overflow: 'auto',
});

export const sheetGrid = style({
  display: 'grid',
  // Header column + data columns. Header column is narrow; data
  // columns expand evenly with a sensible floor for readability.
  gridTemplateColumns: `${space[8]} repeat(var(--col-count), minmax(120px, 1fr))`,
  fontFamily: fontFamily.body,
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].bodyLineHeight,
  minWidth: 'fit-content',
});

export const headerCell = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${space[1]} ${space[2]}`,
  backgroundColor: neutral.solid[3],
  color: neutral.solid[11],
  fontWeight: fontWeight.medium,
  borderRight: `1px solid ${neutral.solid[6]}`,
  borderBottom: `1px solid ${neutral.solid[6]}`,
  userSelect: 'none',
});

export const cell = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  padding: `${space[1]} ${space[2]}`,
  minHeight: space[6],
  backgroundColor: background.surface,
  borderRight: `1px solid ${neutral.solid[6]}`,
  borderBottom: `1px solid ${neutral.solid[6]}`,
  cursor: 'cell',
  transition: `background-color ${moderate[1]} ${standard.productive}`,
  outline: 'none',
  ':hover': {
    backgroundColor: neutral.alpha[3],
  },
});

export const cellSelected = style({
  outline: `2px solid ${accent.solid[8]}`,
  outlineOffset: '-2px',
});

export const cellValue = style({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  width: '100%',
});

export const cellNumeric = style({
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
});

export const cellError = style({
  color: danger.solid[11],
  fontWeight: fontWeight.medium,
});

export const cellInput = style({
  position: 'absolute',
  inset: 0,
  border: `2px solid ${accent.solid[9]}`,
  padding: `0 ${space[2]}`,
  backgroundColor: background.panelSolid,
  color: neutral.solid[12],
  fontFamily: fontFamily.body,
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].bodyLineHeight,
  outline: 'none',
});

// --- Inspector ---

export const cellTag = style({
  fontFamily: fontFamily.code,
  color: accent.solid[11],
});

export const formulaInput = style({
  width: '100%',
  padding: `${space[2]} ${space[3]}`,
  backgroundColor: background.surface,
  border: `1px solid ${neutral.solid[7]}`,
  borderRadius: radius[2],
  color: neutral.solid[12],
  fontFamily: fontFamily.code,
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].bodyLineHeight,
  outline: 'none',
  ':focus': {
    borderColor: accent.solid[8],
  },
  ':disabled': {
    color: neutral.solid[10],
    cursor: 'not-allowed',
  },
});

export const hint = style({
  color: neutral.solid[11],
});

// --- Chart ---

/**
 * Chart surface. `aspect-ratio` keeps text proportional regardless of
 * container width — much friendlier than `preserveAspectRatio="none"`
 * which stretches glyphs.
 */
export const chartSurface = style({
  width: '100%',
  aspectRatio: '5 / 2',
  display: 'block',
});

export const chartGridline = style({
  stroke: neutral.alpha[5],
  strokeWidth: 1,
  strokeDasharray: '2 4',
});

export const chartAxis = style({
  stroke: neutral.solid[7],
  strokeWidth: 1,
});

export const chartBar = style({
  fill: accent.solid[9],
  transition: `fill ${moderate[1]} ${standard.productive}`,
  ':hover': {
    fill: accent.solid[10],
  },
});

export const chartBarNegative = style({
  fill: danger.solid[9],
});

export const chartLabel = style({
  fill: neutral.solid[11],
  fontFamily: fontFamily.body,
  fontSize: typeScale[1].fontSize,
});

export const chartValueLabel = style({
  fill: neutral.solid[12],
  fontFamily: fontFamily.body,
  fontSize: typeScale[1].fontSize,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: fontWeight.medium,
});

export const empty = style({
  fill: neutral.solid[11],
  fontFamily: fontFamily.body,
  fontSize: typeScale[2].fontSize,
});
