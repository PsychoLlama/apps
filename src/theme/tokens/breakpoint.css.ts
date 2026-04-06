/**
 * Breakpoint tokens derived from Radix UI Themes.
 * Source: https://github.com/radix-ui/themes (MIT)
 * Docs: https://www.radix-ui.com/themes/docs/theme/breakpoints
 *
 * Mobile-first (min-width) media query conditions. There is an implicit
 * "initial" breakpoint (no media query) below xs.
 *
 * Usage with Vanilla Extract:
 *
 *   style({
 *     padding: space[2],
 *     '@media': {
 *       [breakpoint.sm]: { padding: space[4] },
 *       [breakpoint.lg]: { padding: space[6] },
 *     },
 *   })
 */
export const breakpoint = {
  xs: '(min-width: 520px)',
  sm: '(min-width: 768px)',
  md: '(min-width: 1024px)',
  lg: '(min-width: 1280px)',
  xl: '(min-width: 1640px)',
} as const;
