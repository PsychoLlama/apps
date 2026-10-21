import { collect } from '@lib/effects';
import { createLogger } from '@lib/observability';
import { downloadPng, downloadSvg } from '../download';
import {
  $exportPanel,
  exportFilenameOf,
  exportSizeOf,
  type IconEditorState,
} from '../state';
import { renderIconSvg } from '../svg';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Canonical size for the SVG export — vector, so any value is fine. */
const SVG_EXPORT_SIZE = 512;

/**
 * Download the icon in the export panel's format: an SVG as-is, or a
 * PNG rasterized at the panel's size. Does nothing without an icon.
 */
export const $exportIcon = collect(
  [$exportPanel],
  (panel) =>
    async (state: IconEditorState): Promise<void> => {
      const icon = state.icon;
      if (!icon) return;

      const filename = exportFilenameOf(panel, icon);

      if (panel.format === 'svg') {
        downloadSvg(
          renderIconSvg(state, { size: SVG_EXPORT_SIZE, metadata: true }),
          filename,
        );
      } else {
        // Render the SVG at the target pixel size so the rasterized
        // intermediate matches the canvas 1:1 — no resample step, no
        // soft-from-upscale artifacts.
        const size = exportSizeOf(panel);
        await downloadPng(renderIconSvg(state, { size }), size, filename);
      }

      logger.info('Exported an icon.', {
        pack: icon.pack,
        name: icon.name,
        format: panel.format,
      });
    },
);
