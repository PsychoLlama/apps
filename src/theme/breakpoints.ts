export const breakpoints = {
  xs: '520px',
  sm: '768px',
  md: '1024px',
  lg: '1280px',
  xl: '1640px',
} as const;

export type Breakpoint = keyof typeof breakpoints;
