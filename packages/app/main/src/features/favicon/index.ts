/**
 * Shared building blocks for the Logo Generator (`/logo`). The internal
 * "favicon" naming reflects the data model — icon + colors + shape +
 * padding rendered as an SVG — and matches the shipped favicon/PNG
 * download formats.
 */

export { ICONS, ICON_VIEWBOX, type IconEntry } from './icons';
export {
  PALETTES,
  findPalette,
  type PaletteName,
  type PaletteOption,
} from './palette';
export {
  DEFAULT_FAVICON_STATE,
  favicon,
  useFaviconActions,
  type FaviconActions,
  type FaviconHydrateInput,
  type FaviconShape,
  type FaviconState,
} from './state';
export { renderFaviconSvg } from './svg';
export { downloadPng, downloadSvg } from './download';
export { Preview } from './components/preview';
export { IconGrid } from './components/icon-grid';
export { PalettePicker } from './components/palette-picker';
export { ShapeSelector } from './components/shape-selector';
export { PaddingSlider } from './components/padding-slider';
export { ExportActions } from './components/export-actions';
export { Field } from './components/field';
export { InlineField } from './components/inline-field';
export { Spec } from './components/spec';
