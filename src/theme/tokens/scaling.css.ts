import { globalStyle, assignVars } from '@vanilla-extract/css';
import { vars } from '../contract.css';

// Wrap scaling in a mini-contract shape for assignVars
const scalingContract = { scaling: vars.scaling };

// Default scaling
globalStyle(':root', {
  vars: assignVars(scalingContract, { scaling: '1' }),
});

// Scaling presets via data attribute
const presets = {
  '90%': '0.9',
  '95%': '0.95',
  '100%': '1',
  '105%': '1.05',
  '110%': '1.1',
} as const;

for (const [attr, value] of Object.entries(presets)) {
  globalStyle(`[data-scaling="${attr}"]`, {
    vars: assignVars(scalingContract, { scaling: value }),
  });
}
