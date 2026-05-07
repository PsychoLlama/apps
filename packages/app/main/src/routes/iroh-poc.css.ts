import { style } from '@vanilla-extract/css';
import { breakpoint, neutral, radius, space } from '@lib/design';

export const layout = style({
  width: '100%',
  maxWidth: '960px',
  alignSelf: 'center',
});

export const panels = style({
  width: '100%',
  gridTemplateColumns: '1fr',
  '@media': {
    [breakpoint.md]: {
      gridTemplateColumns: '1fr 1fr',
    },
  },
});

export const log = style({
  width: '100%',
  minHeight: space[7],
  maxHeight: '320px',
  padding: space[3],
  borderRadius: radius[3],
  background: neutral.solid[2],
  border: `1px solid ${neutral.solid[5]}`,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '12px',
  lineHeight: 1.55,
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

export const idCode = style({
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '12px',
  padding: `${space[1]} ${space[2]}`,
  borderRadius: radius[2],
  background: neutral.solid[3],
  border: `1px solid ${neutral.solid[5]}`,
  wordBreak: 'break-all',
});
