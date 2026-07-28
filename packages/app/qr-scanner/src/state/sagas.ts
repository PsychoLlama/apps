import { AbortError, call, commit, defineSaga, read } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import type { Navigator } from '@solidjs/router';
import {
  cameraFailedTopic,
  cameraOpenedTopic,
  cameraStore,
  codeRecognizedTopic,
  scanRequestedTopic,
  scanStoppedTopic,
  streamCell,
  torchToggledTopic,
} from './camera';
import {
  cameraPermissionGranted,
  classifyCameraError,
  launchScanTarget,
  openCamera,
  releaseCamera,
  setTorch,
  vibrate,
} from './capabilities';
import { decoderCell, decoderReadyTopic } from './decoder';
import { scannerScope } from './scope';
import { createDecoder } from '../decoder';
import type { ScanResult } from '../worker/rpc';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Build a `catch` handler for a saga run. The sagas here commit their own
 * failures, so the rejection left over is the abort from a released anchor —
 * ordinary teardown, and nothing to report. Anything else is a bug, and
 * surfacing it beats letting it land as an unhandled rejection.
 */
export const reportSagaFailure =
  (message: string) =>
  (error: unknown): void => {
    if (error instanceof AbortError) return;
    logger.error(message, { error: toError(error) });
  };

/** A short haptic pulse (ms) confirming a recognized code. */
const SCAN_HAPTIC_MS = 40;

/**
 * Open the camera and surface the result through the session lifecycle:
 * `requesting` on start, `streaming` on success, `error` on failure.
 *
 * Guarded on an idle session so a second start can't open a second stream —
 * which the cell would silently drop unstopped, leaving the camera live. The
 * guard also covers the landing button being tapped while a prompt is
 * already open, so the view needn't disable it defensively.
 *
 * A release mid-request aborts the saga at the instruction boundary, so the
 * `catch` here only ever sees a genuine camera failure; the orphaned stream
 * is stopped by {@link openCamera} itself.
 */
export const startScanSaga = defineSaga(scannerScope, async function* () {
  const { status } = yield* read(cameraStore);
  if (status === 'requesting' || status === 'streaming') return;

  yield commit(scanRequestedTopic());

  try {
    const live = yield* call(openCamera);
    yield commit(cameraOpenedTopic(live));
  } catch (error) {
    // Reported by the capability, which has the context to describe it.
    yield commit(cameraFailedTopic(classifyCameraError(error)));
  }
});

/**
 * Open the feed unprompted on a return visit where camera permission already
 * stands, skipping the landing pitch. Client-only — the Permissions API
 * can't run during SSG — so `QrScanner` starts it from `onMount`.
 *
 * The probe resolves async, so the session is re-read afterwards: a user who
 * started, cancelled, or scanned in the meantime has moved the session on,
 * and reopening the camera under them would be an unasked-for surprise. Only
 * a still-pristine session auto-starts.
 */
export const autoStartScanSaga = defineSaga(scannerScope, async function* () {
  const granted = yield* call(cameraPermissionGranted);
  if (!granted) return;

  const { status, result } = yield* read(cameraStore);
  if (status !== 'idle' || result) return;

  yield* startScanSaga();
});

/**
 * Dismiss the live feed and return to idle. The camera is released before
 * the commit that drops the stream — the reverse order would leave nothing
 * to stop, and the hardware running.
 */
export const stopScanSaga = defineSaga(scannerScope, async function* () {
  const stream = yield* read(streamCell);

  yield* call(releaseCamera, stream);
  yield commit(scanStoppedTopic());

  // The stop-on-hit and unmount paths are traced elsewhere; this is the one
  // the user asked for.
  logger.debug('Camera feed stopped.');
});

/**
 * Toggle the torch on the live stream. The flag only advances once the
 * hardware confirms, so a rejected `applyConstraints` leaves the button
 * reflecting reality. Failures are swallowed: a torch that won't switch is a
 * degraded nicety, not an error worth surfacing.
 */
export const toggleTorchSaga = defineSaga(
  scannerScope,
  async function* (on: boolean) {
    const stream = yield* read(streamCell);

    try {
      const applied = yield* call(setTorch, stream, on);
      yield commit(torchToggledTopic(applied));
    } catch {
      // Logged by the capability. Nothing changed, so nothing to commit.
    }
  },
);

/**
 * Spawn the decoder worker and hold it in state once its wasm is live. Run
 * eagerly on page mount so the module is warm before the camera goes live;
 * the worker then outlives individual camera sessions and is terminated by
 * the cell's drop when the scope dies.
 *
 * Guarded on an empty cell so a second run can't spawn a second worker,
 * which the cell would silently drop unterminated.
 */
export const preloadDecoderSaga = defineSaga(scannerScope, async function* () {
  if (yield* read(decoderCell)) return;

  const connection = yield* call(createDecoder);
  yield commit(decoderReadyTopic(connection));
});

/**
 * A recognized code, plus the router navigator the caller pulled from
 * `useNavigate`. Threading `navigate` through keeps the launch decision —
 * including the in-app route — inside the state layer, rather than making
 * the view react to the stored result.
 */
export interface ScanHit {
  /** The code the decoder recognized. */
  readonly result: ScanResult;
  /** The router's navigator, for a link back into our own origin. */
  readonly navigate: Navigator;
}

/**
 * Finalize a scan on the first hit:
 *
 * 1. Stop the live stream. Holding the camera open behind the result surface
 *    would leave the hardware (and its recording indicator) running with no
 *    visible stop control, so the hit itself releases it; "Scan again"
 *    reopens the camera from scratch.
 * 2. Buzz, as tactile confirmation.
 * 3. Auto-launch the code's link, where that's safe and wanted.
 * 4. Park the session on the result, which swaps the result surface in.
 *
 * The recognition log lives here so it fires once per hit regardless of
 * caller. We log the `format` (e.g. `"QR_CODE"`), never the decoded payload:
 * in keeping with the app's "nothing leaves your device" promise, the
 * contents stay off every diagnostic surface.
 */
export const finishScanSaga = defineSaga(
  scannerScope,
  async function* ({ result, navigate }: ScanHit) {
    const stream = yield* read(streamCell);

    yield* call(releaseCamera, stream);
    yield* call(vibrate, SCAN_HAPTIC_MS);
    yield* call(launchScanTarget, result, navigate);

    logger.info('Recognized a code.', { format: result.format });
    yield commit(codeRecognizedTopic(result));
  },
);
