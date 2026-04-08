import { createGlobalTheme } from '@vanilla-extract/css';

// Elevation scale for subtle depth
export const shadows = createGlobalTheme(':root', {
  shadow: {
    1: '0 1px 2px rgba(0, 0, 0, 0.05)',
    2: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    3: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    4: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    5: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },
});
