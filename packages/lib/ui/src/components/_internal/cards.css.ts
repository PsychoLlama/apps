/**
 * Shared styles for the cards family (`RadioCards` / `CheckboxCards`).
 * Holds the grid container, the `gap` / `columns` variant maps, and
 * the layered classic-variant shadow stack.
 *
 * The classic shadow stack is defined here (rather than colocated with
 * either component) so both share one definition — keeping them in
 * sync if Radix retunes upstream is then a one-file change. Layer math
 * copied verbatim from `_internal/base-card.css` (lines 93-205) in
 * upstream Radix Themes.
 */

import {
  assignVars,
  createThemeContract,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import { black, neutral, space } from '@lib/design';
import { assignColorSchemeVars } from '@lib/design/color-scheme';

// --- Root grid ---
//
// Auto-fit gives a useful mobile-first default — items collapse to a
// single column on narrow screens and stretch to fill on wider ones.
// The numeric `columns` variant below overrides this when set. The
// group itself isn't interactive; `cursor: default` forces an arrow
// over grid gaps so users don't see a misleading pointer hint.

export const root = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  cursor: 'default',
});

// --- Numeric column override ---

const repeat = (count: number) => `repeat(${count}, minmax(0, 1fr))`;
export const columns = styleVariants({
  1: { gridTemplateColumns: repeat(1) },
  2: { gridTemplateColumns: repeat(2) },
  3: { gridTemplateColumns: repeat(3) },
  4: { gridTemplateColumns: repeat(4) },
  5: { gridTemplateColumns: repeat(5) },
  6: { gridTemplateColumns: repeat(6) },
});

// --- Gap ---

export const gap = styleVariants(space, (value) => ({ gap: value }));

// --- Classic variant shadow stack ---
//
// Upstream's classic card uses a 6-layer box-shadow split between the
// item (outer) and `::after` (inner) so the elevation animates between
// rest and hover via `transition: box-shadow`. CSS interpolates layered
// shadows index-by-index, so every state needs the same layer count —
// hence the zeroed-out layers in the rest stack that "grow" on hover.
// Light and dark differ structurally (light is a downward drop shadow;
// dark is a near-radial glow), so a single `light-dark()` won't cover
// it — we register a theme contract and assign per-mode values via
// `assignColorSchemeVars`. This is exactly the per-component shadow
// eject the design package's `shadow.css.ts` documents (case 2:
// animation-matched layers).
//
// Border colors fall back to upstream's no-color-mix branch (per the
// project convention against `color-mix()` progressive enhancement).
// That means hover doesn't actually shift the border color in light
// mode; the elevation lift carries the hover cue on its own.

export const classicShadow = createThemeContract({
  rest: { outer: '', inner: '' },
  hover: { outer: '', inner: '' },
});

const classicShadowsLight = {
  rest: {
    outer: [
      `0 0 0 0 ${neutral.alpha[3]}`,
      `0 0 0 0 transparent`,
      `0 0 0 0 ${black[1]}`,
      `0 1px 1px -1px ${neutral.alpha[2]}`,
      `0 2px 1px -2px ${black[1]}`,
      `0 1px 3px -1px ${black[1]}`,
    ].join(', '),
    inner: [
      `0 0 0 1px ${neutral.alpha[3]}`,
      `0 0 0 1px transparent`,
      `0 0 0 0.5px ${black[1]}`,
      `0 1px 1px 0 ${neutral.alpha[2]}`,
      `0 2px 1px -1px ${black[1]}`,
      `0 1px 3px 0 ${black[1]}`,
    ].join(', '),
  },
  hover: {
    outer: [
      `0 0 0 0 ${neutral.alpha[3]}`,
      `0 1px 1px 0 ${black[1]}`,
      `0 2px 1px -2px ${neutral.alpha[3]}`,
      `0 2px 3px -3px ${black[1]}`,
      `0 3px 12px -5px ${neutral.alpha[3]}`,
      `0 4px 16px -9px ${black[1]}`,
    ].join(', '),
    inner: [
      `0 0 0 1px ${neutral.alpha[3]}`,
      `0 1px 1px 1px ${black[1]}`,
      `0 2px 1px -1px ${neutral.alpha[3]}`,
      `0 2px 3px -2px ${black[1]}`,
      `0 3px 12px -4px ${neutral.alpha[3]}`,
      `0 4px 16px -8px ${black[1]}`,
    ].join(', '),
  },
};

const classicShadowsDark = {
  rest: {
    outer: [
      `0 0 0 0 ${neutral.alpha[6]}`,
      `0 0 0 0 transparent`,
      `0 0 0 0 ${black[3]}`,
      `0 1px 1px -1px ${black[6]}`,
      `0 2px 1px -2px ${black[6]}`,
      `0 1px 3px -1px ${black[5]}`,
    ].join(', '),
    inner: [
      `0 0 0 1px ${neutral.alpha[6]}`,
      `0 0 0 1px transparent`,
      `0 0 0 0.5px ${black[3]}`,
      `0 1px 1px 0 ${black[6]}`,
      `0 2px 1px -1px ${black[6]}`,
      `0 1px 3px 0 ${black[5]}`,
    ].join(', '),
  },
  hover: {
    outer: [
      `0 0 0 0 ${neutral.alpha[6]}`,
      `0 0 1px 0 ${neutral.alpha[4]}`,
      `0 0 1px -2px ${neutral.alpha[4]}`,
      `0 0 3px -3px ${neutral.alpha[3]}`,
      `0 0 12px -3px ${neutral.alpha[3]}`,
      `0 0 16px -9px ${neutral.alpha[7]}`,
    ].join(', '),
    inner: [
      `0 0 0 1px ${neutral.alpha[6]}`,
      `0 0 1px 1px ${neutral.alpha[4]}`,
      `0 0 1px -1px ${neutral.alpha[4]}`,
      `0 0 3px -2px ${neutral.alpha[3]}`,
      `0 0 12px -2px ${neutral.alpha[3]}`,
      `0 0 16px -8px ${neutral.alpha[7]}`,
    ].join(', '),
  },
};

assignColorSchemeVars(
  assignVars(classicShadow, classicShadowsLight),
  assignVars(classicShadow, classicShadowsDark),
);
