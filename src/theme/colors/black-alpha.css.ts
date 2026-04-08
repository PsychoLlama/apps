import {
  createGlobalThemeContract,
  createGlobalTheme,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { alphaContractShape } from './_common';

export const blackAlphaVars = createGlobalThemeContract(
  alphaContractShape('black'),
);

const values = {
  a1: 'rgba(0, 0, 0, 0.05)',
  a2: 'rgba(0, 0, 0, 0.1)',
  a3: 'rgba(0, 0, 0, 0.15)',
  a4: 'rgba(0, 0, 0, 0.2)',
  a5: 'rgba(0, 0, 0, 0.3)',
  a6: 'rgba(0, 0, 0, 0.4)',
  a7: 'rgba(0, 0, 0, 0.5)',
  a8: 'rgba(0, 0, 0, 0.6)',
  a9: 'rgba(0, 0, 0, 0.7)',
  a10: 'rgba(0, 0, 0, 0.8)',
  a11: 'rgba(0, 0, 0, 0.9)',
  a12: 'rgba(0, 0, 0, 0.95)',
};

createGlobalTheme(':root', blackAlphaVars, values);
createGlobalTheme(':root', vars.black, values);
