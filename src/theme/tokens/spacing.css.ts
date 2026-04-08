import { createGlobalTheme } from '@vanilla-extract/css';
import { vars } from '../contract.css';

const px = [4, 8, 12, 16, 24, 32, 40, 48, 64];

const space: Record<string, string> = {};
for (let i = 0; i < px.length; i++) {
  space[i + 1] = `calc(${px[i]}px * ${vars.scaling})`;
}

createGlobalTheme(':root', vars.space, space);
