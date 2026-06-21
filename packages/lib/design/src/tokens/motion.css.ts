/**
 * Motion tokens adapted from IBM Carbon's motion system.
 * Source: https://github.com/carbon-design-system/carbon (Apache-2.0)
 * File: packages/motion/src/index.ts
 */
import {
  assignVars,
  createThemeContract,
  globalStyle,
} from '@vanilla-extract/css';

// --- Types ---

type DurationScale = { readonly 1: string; readonly 2: string };
type EasingCurve = {
  /** Default: efficient micro-interactions. */
  readonly productive: string;

  /** Significant moments that capture attention. */
  readonly expressive: string;
};

// --- Duration (CSS custom properties) ---

const durationTheme = createThemeContract({
  fast: { 1: '', 2: '' },
  moderate: { 1: '', 2: '' },
  slow: { 1: '', 2: '' },
});

/**
 * Concrete duration assignments backing the {@link durationTheme} contract.
 * Internal to the package — deliberately not re-exported from `index.css.ts`.
 * The motion gallery renders these literals directly so its swatches keep
 * demonstrating each duration under `prefers-reduced-motion`, where the CSS
 * vars collapse to `0ms`.
 */
export const durationValues = {
  fast: { 1: '70ms', 2: '110ms' },
  moderate: { 1: '150ms', 2: '240ms' },
  slow: { 1: '400ms', 2: '700ms' },
} as const;

globalStyle(':root', {
  vars: assignVars(durationTheme, durationValues),
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      vars: assignVars(durationTheme, {
        fast: { 1: '0ms', 2: '0ms' },
        moderate: { 1: '0ms', 2: '0ms' },
        slow: { 1: '0ms', 2: '0ms' },
      }),
    },
  },
});

/**
 * Micro-interaction durations. Icon state changes, small toggles,
 * hover highlights. Use for effects the user will trigger many
 * times per session — they should feel instant.
 */
export const fast: DurationScale = durationTheme.fast;

/**
 * Standard UI transition durations. Dropdowns, accordions, tooltips,
 * panel slides. The workhorse range — most component transitions
 * land here.
 */
export const moderate: DurationScale = durationTheme.moderate;

/**
 * Large-scale or ambient durations. Page transitions, empty-state
 * illustrations, skeleton loading pulses. Reserve for moments that
 * benefit from deliberate pacing.
 */
export const slow: DurationScale = durationTheme.slow;

// --- Easing (plain constants) ---

/**
 * Standard easing — the element stays visible throughout.
 * Resizing, reordering, expanding in place, color changes.
 * If the element never enters or leaves the viewport, use this.
 */
export const standard: EasingCurve = {
  /** Efficient, stays out of the way. Most day-to-day interactions. */
  productive: 'cubic-bezier(0.2, 0, 0.38, 0.9)',
  /** Slightly dramatic. Brand moments, primary action emphasis. */
  expressive: 'cubic-bezier(0.4, 0.14, 0.3, 1)',
} as const;

/**
 * Entrance easing — an element is being added to the view.
 * Modals appearing, dropdowns opening, toasts arriving.
 * Starts fast (no visible acceleration), decelerates into place.
 */
export const entrance: EasingCurve = {
  /** Quick, functional entrance. Tooltips, dropdowns, popovers. */
  productive: 'cubic-bezier(0, 0, 0.38, 0.9)',
  /** Expressive entrance. Dialogs, drawers, page transitions. */
  expressive: 'cubic-bezier(0, 0, 0.3, 1)',
} as const;

/**
 * Exit easing — an element is being permanently removed.
 * Modal closing, notification dismissing, toast departing.
 * If the element merely hides but stays accessible (e.g. a
 * collapsible sidebar), use `standard` instead.
 */
export const exit: EasingCurve = {
  /** Quick, functional exit. Tooltip dismiss, dropdown close. */
  productive: 'cubic-bezier(0.2, 0, 1, 0.9)',
  /** Expressive exit. Dialog close, drawer dismiss. */
  expressive: 'cubic-bezier(0.4, 0.14, 1, 1)',
} as const;
