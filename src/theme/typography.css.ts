import { createGlobalTheme } from '@vanilla-extract/css';

export const typography = createGlobalTheme(':root', {
  font: {
    body: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    mono: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  },

  // Radix-style font size scale
  fontSize: {
    1: '0.75rem',
    2: '0.875rem',
    3: '1rem',
    4: '1.125rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2.188rem',
    9: '3.75rem',
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },

  lineHeight: {
    1: '1.0',
    2: '1.25',
    3: '1.5',
  },

  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
  },
});
