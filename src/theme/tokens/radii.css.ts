import {
  createGlobalTheme,
  createVar,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';

const radiusFactor = createVar();

// Default radius factor
globalStyle(':root', {
  vars: { [radiusFactor]: '1' },
});

const radiusPx = [3, 4, 6, 8, 12, 16];
const radius: Record<string, string> = {};
for (let i = 0; i < radiusPx.length; i++) {
  radius[i + 1] = `calc(${radiusPx[i]}px * ${vars.scaling} * ${radiusFactor})`;
}
radius.full = '0px';
radius.thumb = '9999px';

createGlobalTheme(':root', vars.radius, radius);

// Radius presets
const presets: Record<string, { factor: string; full: string; thumb: string }> =
  {
    none: { factor: '0', full: '0px', thumb: '0.5px' },
    small: { factor: '0.75', full: '0px', thumb: '0.5px' },
    medium: { factor: '1', full: '0px', thumb: '9999px' },
    large: { factor: '1.5', full: '0px', thumb: '9999px' },
    full: { factor: '1.5', full: '9999px', thumb: '9999px' },
  };

for (const [name, values] of Object.entries(presets)) {
  globalStyle(`[data-radius="${name}"]`, {
    vars: {
      [radiusFactor]: values.factor,
      ...assignVars(
        { full: vars.radius.full, thumb: vars.radius.thumb },
        { full: values.full, thumb: values.thumb },
      ),
    },
  });
}
