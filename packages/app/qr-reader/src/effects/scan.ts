import { collect } from '@lib/effects';
import { createLogger } from '@lib/observability';
import type { Navigator } from '@solidjs/router';
import { launchScanTarget, vibrate } from '../platform/device';
import { $codeRecognized } from '../state';
import type { ScanResult } from '../worker/rpc';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** A short haptic pulse (ms) confirming a recognized code. */
const SCAN_HAPTIC_MS = 40;

/**
 * Finalize a scan on the first hit:
 *
 * 1. Buzz, as tactile confirmation.
 * 2. Auto-launch the code's link, where that's safe and wanted.
 * 3. Park the session on the result, which swaps the result surface in.
 *    Leaving `streaming` releases the camera: holding it open behind the
 *    result would leave the hardware (and its recording indicator) running
 *    with no visible stop control. "Scan again" reopens it from scratch.
 *
 * Takes the router's navigator from the caller, so a link back into our
 * own origin routes in-app without the view reacting to the stored result.
 *
 * Logs the `format` (e.g. `"QR_CODE"`), never the decoded payload: in
 * keeping with the app's "nothing leaves your device" promise, the contents
 * stay off every diagnostic surface.
 */
export const $finishScan = collect(
  [$codeRecognized],
  (codeRecognized) => (result: ScanResult, navigate: Navigator) => {
    vibrate(SCAN_HAPTIC_MS);
    launchScanTarget(result, navigate);

    logger.info('Recognized a code.', { format: result.format });
    codeRecognized(result);
  },
);
