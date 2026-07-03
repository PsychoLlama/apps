import { defineAction, defineEffect, ref } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import { encodeQrCode } from './capabilities';
import { qrCodeStore, type QrGrid } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Land a freshly encoded grid, ready for the view to paint. */
const setQrCode = defineAction([qrCodeStore], (state, grid: QrGrid) => {
  state.grid = ref(grid);
});

/**
 * Drop the grid and log the failure. Non-fatal: the share link is still
 * copyable from its text field, so a missing QR just hides the affordance
 * rather than blocking the view.
 */
const clearQrCode = defineAction([qrCodeStore], (state, error: Error) => {
  state.grid = null;
  logger.error('Failed to encode the share link as a QR code.', {
    error: toError(error),
  });
});

/**
 * Encode the live share link into a QR grid, storing it for the view. Runs
 * client-side once the endpoint is up — the wasm encoder and the link are both
 * client-only — so the sharer's view performs it as the connection lands.
 */
export const encodeQrCodeEffect = defineEffect([], encodeQrCode, {
  onSuccess: setQrCode,
  onFailure: clearQrCode,
});
