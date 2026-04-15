import { setThemeColors } from '#design/theme';
import { amber } from '#design/palette/amber';
import { blue, blueAlpha } from '#design/palette/blue';
import { grass } from '#design/palette/grass';
import { gray } from '#design/palette/gray';
import { red } from '#design/palette/red';
import { slate, slateAlpha } from '#design/palette/slate';

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
