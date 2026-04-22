import { setThemeColors } from '@psychollama/design/theme';
import { amber } from '@psychollama/design/palette/amber';
import { blue, blueAlpha } from '@psychollama/design/palette/blue';
import { grass } from '@psychollama/design/palette/grass';
import { gray } from '@psychollama/design/palette/gray';
import { red } from '@psychollama/design/palette/red';
import { slate, slateAlpha } from '@psychollama/design/palette/slate';

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
