import { setThemeColors } from '@lib/design/theme';
import { amber } from '@lib/design/palette/amber';
import { blue, blueAlpha } from '@lib/design/palette/blue';
import { grass } from '@lib/design/palette/grass';
import { gray } from '@lib/design/palette/gray';
import { red } from '@lib/design/palette/red';
import { slate, slateAlpha } from '@lib/design/palette/slate';

setThemeColors({
  accent: blue,
  accentAlpha: blueAlpha,
  neutral: slate,
  neutralAlpha: slateAlpha,
  danger: red,
  warning: amber,
  success: grass,
  text: gray,
});
