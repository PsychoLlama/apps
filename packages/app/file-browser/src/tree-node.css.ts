import { keyframes, style } from '@vanilla-extract/css';
import {
  accent,
  fast,
  fontWeight,
  neutral,
  radius,
  space,
  standard,
} from '@lib/design';

export const list = style({
  listStyle: 'none',
});

// Tree row. Indented by depth via the inline `--tree-depth` custom
// property — multiplied by space[3] in calc so it stays in tokens.
export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[2],
  width: '100%',
  textAlign: 'left',
  paddingBlock: space[1],
  paddingRight: space[3],
  paddingLeft: `calc(${space[3]} + var(--tree-depth, 0) * ${space[4]})`,
  borderRadius: radius[2],
  color: neutral.solid[12],
  cursor: 'pointer',
  transition: `background-color ${fast[1]} ${standard.productive}`,
  selectors: {
    '&:hover': { backgroundColor: neutral.alpha[3] },
    '&:focus-visible': { outline: `2px solid ${accent.solid[8]}` },
    '&[data-selected]': {
      backgroundColor: accent.solid[4],
      color: accent.solid[12],
      fontWeight: fontWeight.medium,
    },
  },
});

export const chevron = style({
  width: space[3],
  height: space[3],
  flexShrink: 0,
  color: neutral.solid[11],
  transition: `transform ${fast[2]} ${standard.productive}`,
});

export const chevronOpen = style({
  transform: 'rotate(90deg)',
});

export const chevronSpacer = style({
  width: space[3],
  flexShrink: 0,
});

export const icon = style({
  flexShrink: 0,
  color: neutral.solid[11],
  selectors: {
    [`${row}[data-selected] &`]: { color: accent.solid[11] },
  },
});

export const name = style({
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

// Continuous rotation for the loading icon that replaces the chevron
// while a directory's children are in flight. Local keyframes keep the
// animation scoped to the file-browser; @lib/design owns timing tokens
// but not raw `@keyframes`.
const spinKeyframes = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const spinner = style({
  width: space[3],
  height: space[3],
  flexShrink: 0,
  color: neutral.solid[11],
  animation: `${spinKeyframes} 0.8s linear infinite`,
});

export const failed = style({
  paddingBlock: space[1],
  paddingLeft: `calc(${space[5]} + var(--tree-depth, 0) * ${space[4]})`,
  color: neutral.solid[11],
});
