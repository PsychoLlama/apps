import {
  createGlobalThemeContract,
  createGlobalTheme,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { alphaContractShape } from './_common';

export const whiteAlphaVars = createGlobalThemeContract(
  alphaContractShape('white'),
);

const values = {
  a1: 'rgba(255, 255, 255, 0.05)',
  a2: 'rgba(255, 255, 255, 0.1)',
  a3: 'rgba(255, 255, 255, 0.15)',
  a4: 'rgba(255, 255, 255, 0.2)',
  a5: 'rgba(255, 255, 255, 0.3)',
  a6: 'rgba(255, 255, 255, 0.4)',
  a7: 'rgba(255, 255, 255, 0.5)',
  a8: 'rgba(255, 255, 255, 0.6)',
  a9: 'rgba(255, 255, 255, 0.7)',
  a10: 'rgba(255, 255, 255, 0.8)',
  a11: 'rgba(255, 255, 255, 0.9)',
  a12: 'rgba(255, 255, 255, 0.95)',
};

createGlobalTheme(':root', whiteAlphaVars, values);
createGlobalTheme(':root', vars.white, values);
