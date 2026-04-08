import { createGlobalTheme } from '@vanilla-extract/css';

// Radix-style radius scale
export const radius = createGlobalTheme(':root', {
  radius: {
    1: '0.188rem',
    2: '0.25rem',
    3: '0.375rem',
    4: '0.5rem',
    5: '0.75rem',
    6: '1rem',
    full: '9999px',
  },
});
