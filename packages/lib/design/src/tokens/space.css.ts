/**
 * Spacing tokens derived from Radix UI Themes' spacing scale.
 * Source: https://github.com/radix-ui/themes (MIT)
 * Docs: https://www.radix-ui.com/themes/docs/theme/spacing
 *
 * 9-step scale built on a 4px base unit, expressed in rem so it scales with
 * browser font-size preferences (same rationale as the type scale). The
 * progression is hand-tuned: tight 4px increments for small gaps, then
 * larger jumps for section-level rhythm.
 *
 * These are plain constants, not a theme contract, because spacing values
 * are typographic/layout invariants — not themeable design choices.
 */
export const space = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.5rem',
  6: '2rem',
  7: '2.5rem',
  8: '3rem',
  9: '4rem',
} as const;

export type SpaceScale = keyof typeof space;
