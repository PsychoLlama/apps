/**
 * Validation for the style fields a shareable URL can carry. Pure and
 * total: anything unparseable falls back to a canonical default rather
 * than reaching state, so a fold can apply the result verbatim.
 */

import { PALETTES, type PaletteName } from './palette';
import {
  DEFAULT_ICON_EDITOR_STATE,
  type IconEditorShape,
  type IconEditorStyle,
} from './store';

/** Raw, unvalidated style fields as they arrive from search params. */
export interface IconEditorStyleHydration {
  /** Palette name from the curated set. */
  palette?: string;
  /** Shape mask. */
  shape?: string;
  /** Padding percent (`0`–`40`). */
  padding?: number;
}

const SHAPES: ReadonlyArray<IconEditorShape> = [
  'square',
  'rounded',
  'squircle',
  'circle',
];

const PALETTE_NAMES = new Set<string>(PALETTES.map((entry) => entry.name));

const isPaletteName = (value: string): value is PaletteName =>
  PALETTE_NAMES.has(value);

const isShape = (value: string): value is IconEditorShape =>
  (SHAPES as ReadonlyArray<string>).includes(value);

const clampPadding = (value: number): number =>
  Math.max(0, Math.min(40, Math.floor(value)));

/**
 * Resolve a hydrate input into a complete style snapshot. Missing or
 * unparseable fields fall back to {@link DEFAULT_ICON_EDITOR_STATE} —
 * the URL is the source of truth, so a clean `/icon-editor` link must
 * render the canonical defaults regardless of what the editor was
 * holding a moment earlier.
 */
export const resolveStyleHydration = (
  input: IconEditorStyleHydration,
): IconEditorStyle => {
  const palette =
    input.palette && isPaletteName(input.palette) ? input.palette : undefined;
  const shape = input.shape && isShape(input.shape) ? input.shape : undefined;
  const padding =
    input.padding !== undefined && Number.isFinite(input.padding)
      ? clampPadding(input.padding)
      : undefined;
  return {
    palette: palette ?? DEFAULT_ICON_EDITOR_STATE.palette,
    shape: shape ?? DEFAULT_ICON_EDITOR_STATE.shape,
    padding: padding ?? DEFAULT_ICON_EDITOR_STATE.padding,
  };
};
