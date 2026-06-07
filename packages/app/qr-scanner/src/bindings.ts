import { defineAction, defineEffect, ref } from '@lib/state';
import { createLogger } from '@lib/observability';
import {
  CameraAborted,
  classifyCameraError,
  openCameraSession,
  setTorch,
  stopStream,
  supportsTorch,
  teardownScanner,
} from './capabilities';
import { createDecoder } from './decoder';
import { scannerStore, type ScanResult } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Enter the requesting state, bumping the generation and clearing any prior error. */
export const beginRequest = defineAction([scannerStore], (state) => {
  state.status = 'requesting';
  state.error = null;
  state.generation += 1;
});

/** Attach a freshly opened stream and go live, probing it for a torch. */
export const activateStream = defineAction(
  [scannerStore],
  (state, stream: MediaStream) => {
    state.status = 'streaming';
    state.stream = ref(stream);
    state.error = null;
    state.torch = { supported: supportsTorch(stream), on: false };
  },
);

/** Record the torch's confirmed state after the hardware accepts the change. */
export const setTorchOn = defineAction([scannerStore], (state, on: boolean) => {
  state.torch.on = on;
});

/** Record a failed request, normalizing the cause for the UI. */
export const failCamera = defineAction(
  [scannerStore],
  (state, error: Error) => {
    // A superseded request already had its state torn down — by a newer
    // request, or by `endSession` on unmount — and a newer request may
    // now be in flight, so leave state untouched rather than clobber it
    // with a spurious error.
    if (error instanceof CameraAborted) return;

    state.status = 'error';
    state.error = classifyCameraError(error);
    state.stream = null;
    state.torch = { supported: false, on: false };
    state.result = null;
  },
);

/** Return to the idle landing state. Assumes the stream is already stopped. */
export const resetScanner = defineAction([scannerStore], (state) => {
  state.status = 'idle';
  state.stream = null;
  state.error = null;
  state.torch = { supported: false, on: false };
  state.result = null;
});

/**
 * Tear the whole session down to idle in a single flush: drop the
 * stream, clear the decoder reference and last result, reset the torch
 * and error, and bump the generation. The bump matters when the scanner
 * unmounts mid-prompt — it signals the pending {@link openCameraSession}
 * to stop its stream once it resolves rather than store an orphaned,
 * uncancellable camera. The matching physical teardown (stopping the
 * stream, terminating the worker) runs in {@link shutdownScannerEffect}.
 */
export const endSession = defineAction([scannerStore], (state) => {
  state.status = 'idle';
  state.stream = null;
  state.error = null;
  state.torch = { supported: false, on: false };
  state.result = null;
  state.decoder = null;
  state.generation += 1;
});

/** Store the decoder worker once it's spawned and its wasm is live. */
export const attachDecoder = defineAction(
  [scannerStore],
  (state, worker: Worker) => {
    state.decoder = ref(worker);
  },
);

/**
 * Record a recognized code and emit the one recognition log we keep —
 * centralized here so it fires once per hit regardless of caller. We log
 * the `format` (e.g. `"QR_CODE"`), never the decoded payload: in keeping
 * with the app's "nothing leaves your device" promise, the contents stay
 * off every diagnostic surface.
 */
export const recordScan = defineAction(
  [scannerStore],
  (state, result: ScanResult) => {
    state.result = result;
    logger.info('Recognized a code.', { format: result.format });
  },
);

/**
 * Open the camera and surface the result through the session lifecycle:
 * `requesting` on start, `streaming` on success, `error` on failure. The
 * effect reads the store so {@link openCameraSession} can detect
 * supersession mid-prompt.
 */
export const startCameraEffect = defineEffect(
  [scannerStore],
  openCameraSession,
  {
    onStart: beginRequest,
    onSuccess: activateStream,
    onFailure: failCamera,
  },
);

/**
 * Tear down the active stream and return to idle. `stopStream` runs
 * first (releasing the hardware), then `resetScanner` clears the state —
 * order matters, since the reset drops the stream reference the stop
 * needs.
 */
export const stopCameraEffect = defineEffect([scannerStore], stopStream, {
  onSuccess: resetScanner,
});

/**
 * Toggle the torch on the live stream. The `on` flag only advances once
 * the hardware confirms via `onSuccess` — so a rejected `applyConstraints`
 * leaves the button reflecting reality. Failures are swallowed: a torch
 * that won't switch is a degraded nicety, not an error worth surfacing.
 */
export const toggleTorchEffect = defineEffect([scannerStore], setTorch, {
  onSuccess: setTorchOn,
  onFailure: defineAction([scannerStore], () => {}),
});

/**
 * Spawn the decoder worker and store it once its wasm is live. Run
 * eagerly on page mount so the module is warm before the camera goes
 * live; the worker then outlives individual camera sessions.
 */
export const startDecodingEffect = defineEffect([scannerStore], createDecoder, {
  onSuccess: attachDecoder,
});

/**
 * Tear the scanner down on page unmount in one dispatch: release the
 * camera stream (a no-op if none is open) and terminate the decoder
 * worker, then reset state via {@link endSession}. Safe in any lifecycle
 * state — each physical teardown step no-ops when its resource is absent,
 * and the generation bump supersedes a request still pending mid-prompt.
 */
export const shutdownScannerEffect = defineEffect(
  [scannerStore],
  teardownScanner,
  { onSuccess: endSession },
);
