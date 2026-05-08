import { findPalette } from './palette';
import type { IconEditorShape, IconEditorState } from './state';

const SHAPE_RX_RATIO: Record<IconEditorShape, number> = {
  square: 0,
  rounded: 0.18,
  squircle: 0.32,
  circle: 0.5,
};

/** Options for {@link renderIconSvg}. */
export interface RenderOptions {
  /**
   * Logical canvas size in user units. Doubles as the `width`/`height`
   * the rasterizer reads when the SVG is loaded as an `<img>`, so for
   * pixel-perfect PNG export pass the desired output size here. Vector
   * exports can pass any value — the viewBox makes them resolution
   * independent. @default 512
   */
  size?: number;
  /**
   * When true, the SVG fills its container via `width="100%" height="100%"`
   * — used for live preview tiles. When false, the SVG carries explicit
   * pixel dimensions so the browser can rasterize it for PNG export.
   */
  responsive?: boolean;
  /**
   * Suffix for the SVG-internal `clipPath` id. Inline SVGs share the
   * host document's id namespace, so multiple previews on the same page
   * need distinct ids to keep `clip-path: url(#…)` references from
   * resolving to a sibling preview's clip. @default 'icon'
   */
  idSuffix?: string;
}

/**
 * Serialize a {@link IconEditorState} to a self-contained SVG document.
 *
 * Icon bodies use `currentColor`; the wrapping `<g>` sets `color` so a
 * single `style` carries the foreground tint without rewriting paths.
 *
 * The icon group is clipped to the same rounded rectangle as the
 * background fill, so glyphs that reach the icon viewBox edges stay
 * inside the chosen shape mask instead of leaking into the corner
 * cutouts.
 *
 * Per-pack viewBox dimensions ride on `state.icon.{width,height}` —
 * different iconify collections ship at 16, 24, 32, 48, etc. The icon
 * uniformly scales to fit the inner padded square and centers along
 * the off-axis when the icon's native viewBox isn't square.
 */
export const renderIconSvg = (
  state: IconEditorState,
  opts: RenderOptions = {},
): string => {
  const size = opts.size ?? 512;
  const rx = SHAPE_RX_RATIO[state.shape] * size;
  const pad = (state.padding / 100) * size;
  const inner = size - 2 * pad;
  const iconW = state.icon.width;
  const iconH = state.icon.height;
  const scale = inner / Math.max(iconW, iconH);
  const offsetX = pad + (inner - iconW * scale) / 2;
  const offsetY = pad + (inner - iconH * scale) / 2;
  const dim = opts.responsive
    ? ' width="100%" height="100%"'
    : ` width="${size}" height="${size}"`;
  const clipId = `icon-clip-${opts.idSuffix ?? 'icon'}`;
  // `findPalette` only ever returns `undefined` for an unknown name —
  // store mutations are guarded by validation, but the `palette` field
  // is typed as a union from a curated set, so the lookup is total at
  // the type level. Fall back defensively just in case.
  const palette = findPalette(state.palette);
  const bg = palette?.bg ?? '#0090ff';
  const fg = palette?.fg ?? '#ffffff';
  // `color-scheme: light` pins the SVG's rendering context so the icon
  // looks identical regardless of the host page's color scheme. The
  // fills are already literal hex, but the property forecloses any
  // inherited dark-mode adjustments to currentColor or system colors.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"${dim} style="color-scheme: light">` +
    `<defs><clipPath id="${clipId}"><rect width="${size}" height="${size}" rx="${rx}" ry="${rx}"/></clipPath></defs>` +
    `<g clip-path="url(#${clipId})">` +
    `<rect width="${size}" height="${size}" fill="${bg}"/>` +
    `<g transform="translate(${offsetX} ${offsetY}) scale(${scale})" style="color: ${fg}">${state.icon.body}</g>` +
    `</g>` +
    `</svg>`
  );
};
