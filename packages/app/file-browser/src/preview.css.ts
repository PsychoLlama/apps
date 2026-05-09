import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

// Iframe sized to a reasonable working area without depending on a
// definite parent height — the metadata pane is inside a ScrollArea
// where flex-grow doesn't help. A vh-bounded fixed height keeps it
// useful on tall monitors and modest on shorter ones.
export const frame = style({
  width: '100%',
  minHeight: '320px',
  height: '60vh',
  maxHeight: '640px',
  border: `1px solid ${neutral.solid[6]}`,
  borderRadius: radius[3],
  background: neutral.solid[1],
});

export const noPreview = style({
  width: '100%',
  minHeight: '160px',
  borderRadius: radius[3],
  border: `1px dashed ${neutral.solid[6]}`,
  paddingBlock: space[5],
  paddingInline: space[4],
  color: neutral.solid[10],
});
