import { setThemeColors } from '@lib/design/theme';
import { amber } from '@lib/design/palette/amber';
import { blue } from '@lib/design/palette/blue';
import { grass } from '@lib/design/palette/grass';
import { gray } from '@lib/design/palette/gray';
import { red } from '@lib/design/palette/red';
import { slate } from '@lib/design/palette/slate';

setThemeColors({
  accent: blue,
  neutral: slate,
  danger: red,
  warning: amber,
  success: grass,
  text: { 11: gray.solid[11], 12: gray.solid[12] },
});
