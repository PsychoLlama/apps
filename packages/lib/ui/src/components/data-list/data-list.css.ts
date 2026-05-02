/**
 * DataList styles.
 *
 * Ported from Radix UI Themes Data List. Deviations:
 * - `size`, `orientation`, and `align` are static classes — no responsive
 *   `data-*` cascade.
 * - Drops the value margin-trim trick that lets the value bleed past
 *   horizontal row edges. Items align cleanly at the label baseline.
 * - Drops the implicit `min-width: 120px` on horizontal labels. Subgrid
 *   sizes the column from content; consumers set a width if they need one.
 * - Size 3 gap is `space[5]` (the nearest token) instead of upstream's
 *   `calc(--space-4 * 1.25)` which has no token equivalent here.
 * - No `highContrast` styling.
 *
 * @see https://www.radix-ui.com/themes/docs/components/data-list
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  danger,
  fontFamily,
  fontWeight,
  neutral,
  space,
  success,
  warning,
} from '@lib/design';

const rootBase = style({
  fontFamily: fontFamily.body,
  fontWeight: fontWeight.regular,
  // Stay upright if a DataList is rendered inside an italic context.
  fontStyle: 'normal',
  textAlign: 'start',
  overflowWrap: 'anywhere',
});

export const orientation = styleVariants({
  vertical: [rootBase, { display: 'flex', flexDirection: 'column' }],
  horizontal: [rootBase, { display: 'grid', gridTemplateColumns: 'auto 1fr' }],
});

export const size = styleVariants({
  1: { gap: space[3] },
  2: { gap: space[4] },
  3: { gap: space[5] },
});

export const item = style({
  selectors: {
    [`:where(${orientation.vertical}) > &`]: {
      display: 'flex',
      flexDirection: 'column',
      gap: space[1],
    },
    [`:where(${orientation.horizontal}) > &`]: {
      display: 'grid',
      // Subgrid keeps every row's label column in the same track.
      gridTemplateColumns: 'subgrid',
      gap: 'inherit',
      gridColumn: 'span 2',
      alignItems: 'baseline',
    },
  },
});

const horizontalAlign = (value: string) => ({
  selectors: {
    [`:where(${orientation.horizontal}) > &`]: { alignItems: value },
  },
});

export const align = styleVariants({
  start: horizontalAlign('flex-start'),
  center: horizontalAlign('center'),
  end: horizontalAlign('flex-end'),
  baseline: horizontalAlign('baseline'),
  stretch: horizontalAlign('stretch'),
});

// Zero-width joiner. Establishes a text baseline inside the flex parent
// so non-text children (icons, badges) align with the text in the
// adjacent label/value cell.
const baselineAnchor = {
  '::before': { content: '"\\200D"' },
} as const;

export const label = style({
  display: 'flex',
  color: neutral.alpha[11],
  ...baselineAnchor,
  selectors: {
    // Allow the label text to truncate when the row constrains it.
    [`:where(${orientation.vertical}) > * > &`]: { minWidth: 0 },
  },
});

export const labelColor = styleVariants({
  accent: { color: accent.alpha[11] },
  neutral: { color: neutral.alpha[11] },
  danger: { color: danger.alpha[11] },
  warning: { color: warning.alpha[11] },
  success: { color: success.alpha[11] },
});

export const value = style({
  display: 'flex',
  // Allow the value to truncate when the row constrains it.
  minWidth: 0,
  ...baselineAnchor,
});
