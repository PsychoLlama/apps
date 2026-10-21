import { defineCommand, defineStore } from '@lib/state/next';
import type { IconRef } from '../icons';

/** File formats the editor exports. */
export type ExportFormat = 'svg' | 'png';

/** The export panel's choices. */
export interface ExportPanelState {
  /** Output format the user picked. */
  format: ExportFormat;

  /** Output size in pixels — only meaningful when `format === 'png'`. */
  size: number;
}

/** Default PNG size, in pixels. */
export const DEFAULT_EXPORT_SIZE = 512;

/** Smallest PNG size, in pixels. */
export const MIN_EXPORT_SIZE = 16;

/** Largest PNG size, in pixels. */
export const MAX_EXPORT_SIZE = 2048;

/**
 * The export panel's choices. Outlives the panel through
 * `$editorLifetime`, so the format and size survive the rail swapping
 * it out.
 */
export const $exportPanel = defineStore<ExportPanelState>(() => ({
  format: 'svg',
  size: DEFAULT_EXPORT_SIZE,
}));

/** The output format toggled between vector and raster. */
export const $formatChanged = defineCommand(
  [$exportPanel],
  (panel) => (format: ExportFormat) => {
    panel.format = format;
  },
);

/** The target pixel size changed — from the input or a preset chip. */
export const $sizeChanged = defineCommand(
  [$exportPanel],
  (panel) => (size: number) => {
    if (Number.isFinite(size)) panel.size = size;
  },
);

// --- Derived ---

/** The PNG size to render, clamped to what the exporter supports. */
export const exportSizeOf = (panel: ExportPanelState): number =>
  Math.max(MIN_EXPORT_SIZE, Math.min(MAX_EXPORT_SIZE, Math.round(panel.size)));

/** The download's filename, e.g. `icon-mdi-home-512.png`. */
export const exportFilenameOf = (panel: ExportPanelState, icon: IconRef) => {
  const stem = `icon-${icon.pack}-${icon.name}`;

  return panel.format === 'svg'
    ? `${stem}.svg`
    : `${stem}-${exportSizeOf(panel)}.png`;
};
