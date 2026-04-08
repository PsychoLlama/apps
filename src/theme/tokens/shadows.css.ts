import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../contract.css';

const g = vars.gray;
const b = vars.black;

// Light mode shadows
const lightShadows = {
  [vars.shadow[1]]:
    `inset 0 0 0 1px ${g.a5}, inset 0 1.5px 2px 0 ${g.a2}, inset 0 1.5px 2px 0 ${b.a2}`,
  [vars.shadow[2]]:
    `0 0 0 1px ${g.a3}, 0 0 0 0.5px ${b.a1}, 0 1px 1px 0 ${g.a2}, 0 2px 1px -1px ${b.a1}, 0 1px 3px 0 ${b.a1}`,
  [vars.shadow[3]]:
    `0 0 0 1px ${g.a3}, 0 2px 3px -2px ${g.a3}, 0 3px 12px -4px ${b.a2}, 0 4px 16px -8px ${b.a2}`,
  [vars.shadow[4]]:
    `0 0 0 1px ${g.a3}, 0 8px 40px ${b.a1}, 0 12px 32px -16px ${g.a3}`,
  [vars.shadow[5]]:
    `0 0 0 1px ${g.a3}, 0 12px 60px ${b.a3}, 0 12px 32px -16px ${g.a5}`,
  [vars.shadow[6]]:
    `0 0 0 1px ${g.a3}, 0 12px 60px ${b.a3}, 0 16px 64px ${g.a2}, 0 16px 36px -20px ${g.a7}`,
};

// Dark mode shadows
const darkShadows = {
  [vars.shadow[1]]:
    `inset 0 -1px 1px 0 ${g.a3}, inset 0 0 0 1px ${g.a3}, inset 0 3px 4px 0 ${b.a5}, inset 0 0 0 1px ${g.a4}`,
  [vars.shadow[2]]:
    `0 0 0 1px ${g.a6}, 0 0 0 0.5px ${b.a3}, 0 1px 1px 0 ${b.a6}, 0 2px 1px -1px ${b.a6}, 0 1px 3px 0 ${b.a5}`,
  [vars.shadow[3]]:
    `0 0 0 1px ${g.a6}, 0 2px 3px -2px ${b.a3}, 0 3px 8px -2px ${b.a6}, 0 4px 12px -4px ${b.a7}`,
  [vars.shadow[4]]:
    `0 0 0 1px ${g.a6}, 0 8px 40px ${b.a3}, 0 12px 32px -16px ${b.a5}`,
  [vars.shadow[5]]:
    `0 0 0 1px ${g.a6}, 0 12px 60px ${b.a5}, 0 12px 32px -16px ${b.a7}`,
  [vars.shadow[6]]:
    `0 0 0 1px ${g.a6}, 0 12px 60px ${b.a4}, 0 16px 64px ${b.a6}, 0 16px 36px -20px ${b.a11}`,
};

globalStyle(':root, [data-theme="light"]', { vars: lightShadows });
globalStyle('[data-theme="dark"]', { vars: darkShadows });

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: darkShadows,
    },
  },
});
