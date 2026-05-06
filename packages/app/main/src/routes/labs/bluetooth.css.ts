import { style } from '@vanilla-extract/css';
import {
  background,
  neutral,
  radius,
  space,
  success,
  warning,
} from '@lib/design';

const monoStack = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const codeBlock = style({
  fontFamily: monoStack,
  background: background.surface,
  border: `1px solid ${neutral.solid[6]}`,
  borderRadius: radius[3],
  padding: `${space[2]} ${space[3]}`,
  overflowX: 'auto',
  whiteSpace: 'pre',
});

export const log = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[1],
  maxHeight: '320px',
  overflowY: 'auto',
  padding: space[2],
  background: background.surface,
  border: `1px solid ${neutral.solid[6]}`,
  borderRadius: radius[3],
  fontFamily: monoStack,
});

export const logRow = style({
  display: 'grid',
  gridTemplateColumns: 'auto auto 1fr',
  gap: space[2],
  alignItems: 'baseline',
  padding: `${space[1]} ${space[2]}`,
  borderRadius: radius[2],
});

export const logRowTx = style({
  color: warning.solid[11],
});

export const logRowRx = style({
  color: success.solid[11],
});
