import { findPalette } from './palette';
import type { IconEditorShape, IconEditorState } from './state';

/** Minimal XML-text escape — covers everything iconify metadata might carry. */
const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });

/**
 * Build a Dublin Core / Creative Commons `<metadata>` block crediting
 * the icon's source. Inkscape and the SVG-attribution community use
 * the same shape, so consumers (file inspectors, asset pipelines)
 * can scrape it without bespoke parsing. The caller is responsible
 * for only invoking this when an icon has been chosen.
 */
const renderAttributionMetadata = (
  icon: NonNullable<IconEditorState['icon']>,
): string => {
  const fields: string[] = [];
  fields.push(
    `<dc:title>${escapeXml(`${icon.pack}:${icon.name}`)}</dc:title>`,
    `<dc:identifier>${escapeXml(`${icon.pack}:${icon.name}`)}</dc:identifier>`,
  );
  if (icon.author?.name) {
    const url = icon.author.url
      ? ` rdf:about="${escapeXml(icon.author.url)}"`
      : '';
    fields.push(
      `<dc:creator><cc:Agent${url}><dc:title>${escapeXml(icon.author.name)}</dc:title></cc:Agent></dc:creator>`,
    );
    if (icon.author.url) {
      fields.push(`<dc:source rdf:resource="${escapeXml(icon.author.url)}"/>`);
    }
  }
  if (icon.license?.title || icon.license?.spdx) {
    const label = icon.license.title ?? icon.license.spdx ?? 'License';
    fields.push(
      `<dc:rights><cc:Agent><dc:title>${escapeXml(label)}</dc:title></cc:Agent></dc:rights>`,
    );
  }
  if (icon.license?.url) {
    fields.push(`<cc:license rdf:resource="${escapeXml(icon.license.url)}"/>`);
  }
  if (icon.license?.spdx) {
    fields.push(
      `<dc:rightsHolder>${escapeXml(`SPDX:${icon.license.spdx}`)}</dc:rightsHolder>`,
    );
  }
  return (
    `<metadata>` +
    `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#">` +
    `<cc:Work rdf:about="">${fields.join('')}</cc:Work>` +
    `</rdf:RDF>` +
    `</metadata>`
  );
};

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
  /**
   * Embed an attribution `<metadata>` block (Dublin Core / Creative
   * Commons RDF) crediting the icon's pack, author, and license.
   * Off for inline previews (kept lean for repaint cost); on for
   * exports so credit follows the file. @default false
   */
  metadata?: boolean;
}

/** Shared layout pulled from the shape, palette, and padding fields. */
interface CanvasFrame {
  size: number;
  rx: number;
  pad: number;
  inner: number;
  bg: string;
  fg: string;
  dim: string;
  clipId: string;
}

const computeFrame = (
  state: IconEditorState,
  opts: RenderOptions,
): CanvasFrame => {
  const size = opts.size ?? 512;
  // `findPalette` only ever returns `undefined` for an unknown name —
  // store mutations are guarded by validation, but the `palette` field
  // is typed as a union from a curated set, so the lookup is total at
  // the type level. Fall back defensively just in case.
  const palette = findPalette(state.palette);
  return {
    size,
    rx: SHAPE_RX_RATIO[state.shape] * size,
    pad: (state.padding / 100) * size,
    inner: size - 2 * ((state.padding / 100) * size),
    bg: palette?.bg ?? '#0090ff',
    fg: palette?.fg ?? '#ffffff',
    dim: opts.responsive
      ? ' width="100%" height="100%"'
      : ` width="${size}" height="${size}"`,
    clipId: `icon-clip-${opts.idSuffix ?? 'icon'}`,
  };
};

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
 *
 * When `state.icon` is `undefined` the canvas falls back to a
 * blueprint placeholder — same shape mask + palette, with a dashed
 * inner outline and a centered `+` cross to telegraph "no icon
 * chosen yet."
 */
export const renderIconSvg = (
  state: IconEditorState,
  opts: RenderOptions = {},
): string => {
  const frame = computeFrame(state, opts);
  // `color-scheme: light` pins the SVG's rendering context so the icon
  // looks identical regardless of the host page's color scheme. The
  // fills are already literal hex, but the property forecloses any
  // inherited dark-mode adjustments to currentColor or system colors.
  const metadata =
    opts.metadata && state.icon ? renderAttributionMetadata(state.icon) : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${frame.size} ${frame.size}"${frame.dim} style="color-scheme: light">` +
    metadata +
    `<defs><clipPath id="${frame.clipId}"><rect width="${frame.size}" height="${frame.size}" rx="${frame.rx}" ry="${frame.rx}"/></clipPath></defs>` +
    `<g clip-path="url(#${frame.clipId})">` +
    `<rect width="${frame.size}" height="${frame.size}" fill="${frame.bg}"/>` +
    (state.icon ? renderIconBody(frame, state.icon) : renderBlueprint(frame)) +
    `</g>` +
    `</svg>`
  );
};

const renderIconBody = (
  frame: CanvasFrame,
  icon: NonNullable<IconEditorState['icon']>,
): string => {
  const scale = frame.inner / Math.max(icon.width, icon.height);
  const offsetX = frame.pad + (frame.inner - icon.width * scale) / 2;
  const offsetY = frame.pad + (frame.inner - icon.height * scale) / 2;
  return `<g transform="translate(${offsetX} ${offsetY}) scale(${scale})" style="color: ${frame.fg}">${icon.body}</g>`;
};

/**
 * Blueprint placeholder rendered while the user hasn't picked an icon.
 * Uses the active shape + padding so tweaking the style still looks
 * meaningful, plus a dashed outline and `+` cross in the foreground
 * tint as a "drop a glyph here" cue. Stroke widths track the canvas
 * size so the placeholder reads cleanly at every export resolution
 * even though the live preview only uses one.
 */
const renderBlueprint = (frame: CanvasFrame): string => {
  const stroke = Math.max(1, frame.size * 0.012);
  const dash = frame.size * 0.04;
  const cx = frame.size / 2;
  const cy = frame.size / 2;
  const arm = frame.inner * 0.16;
  // Inset by half the stroke so the dashed outline lands inside the
  // padded inner box rather than straddling its edge.
  const insetX = frame.pad + stroke / 2;
  const insetY = frame.pad + stroke / 2;
  const insetSize = frame.inner - stroke;
  // Shrink the corner radius proportionally so the dashed rect reads as
  // an inset of the outer shape rather than a contrasting silhouette.
  const innerRx = Math.max(0, frame.rx - frame.pad);
  return (
    `<g fill="none" stroke="${frame.fg}" stroke-width="${stroke}" stroke-linecap="round" opacity="0.55">` +
    `<rect x="${insetX}" y="${insetY}" width="${insetSize}" height="${insetSize}" rx="${innerRx}" ry="${innerRx}" stroke-dasharray="${dash} ${dash}"/>` +
    `<line x1="${cx - arm}" y1="${cy}" x2="${cx + arm}" y2="${cy}"/>` +
    `<line x1="${cx}" y1="${cy - arm}" x2="${cx}" y2="${cy + arm}"/>` +
    `</g>`
  );
};
