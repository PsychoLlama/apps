import { defineAction, defineEffect, ref, type DeepReadonly } from '@lib/state';
import { createLogger } from '@lib/observability';
import {
  CameraAborted,
  classifyCameraError,
  inStandalonePWA,
  openCameraSession,
  setTorch,
  stopStream,
  stopStreamForResult,
  supportsTorch,
  teardownScanner,
  vibrate,
} from './capabilities';
import { createDecoder, type DecoderConnection } from './decoder';
import { decoderStore } from './decoder-store';
import { autoOpenHref } from './scan-link';
import { scannerStore, type ScannerState } from './store';
import type { ScanResult } from './worker/rpc';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Enter the requesting state, bumping the generation and clearing any prior error or result. */
export const beginRequest = defineAction([scannerStore], (state) => {
  state.status = 'requesting';
  state.error = null;
  state.result = null;
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
 * Tear the whole session down to idle in a single flush across both
 * stores: drop the stream, clear the decoder reference and last result,
 * reset the torch and error, and bump both generations. The camera bump
 * matters when the scanner unmounts mid-prompt — it signals the pending
 * {@link openCameraSession} to stop its stream once it resolves rather than
 * store an orphaned, uncancellable camera. The decoder bump likewise
 * supersedes a preload still in flight, so its worker self-terminates
 * instead of attaching to a dead page. The matching physical teardown
 * (stopping the stream, terminating the worker) runs in
 * {@link shutdownScannerEffect}.
 */
export const endSession = defineAction(
  [scannerStore, decoderStore],
  (scanner, decoder) => {
    scanner.status = 'idle';
    scanner.stream = null;
    scanner.error = null;
    scanner.torch = { supported: false, on: false };
    scanner.result = null;
    scanner.generation += 1;
    decoder.connection = null;
    decoder.generation += 1;
  },
);

/**
 * Store the decoder connection once it's spawned and its wasm is live. A
 * `null` connection means the preload was superseded by a teardown and has
 * already torn itself down — nothing to attach.
 */
export const attachDecoder = defineAction(
  [decoderStore],
  (decoder, connection: DecoderConnection | null) => {
    if (connection) decoder.connection = ref(connection);
  },
);

/** A short haptic pulse (ms) confirming a recognized code. */
const SCAN_HAPTIC_MS = 40;

/**
 * Record a recognized code and park the session on the result: the stream
 * is already stopped by {@link finishScanEffect}, so drop it and return to
 * idle (keeping `result` set) for the result surface to take over. Buzzes
 * and emits the one recognition log we keep — both centralized here so
 * they fire once per hit regardless of caller. We log the `format` (e.g.
 * `"QR_CODE"`), never the decoded payload: in keeping with the app's
 * "nothing leaves your device" promise, the contents stay off every
 * diagnostic surface.
 */
export const recordScan = defineAction(
  [scannerStore],
  (state, result: ScanResult) => {
    state.status = 'idle';
    state.stream = null;
    state.torch = { supported: false, on: false };
    state.result = result;
    vibrate(SCAN_HAPTIC_MS);
    logger.info('Recognized a code.', { format: result.format });
  },
);

/**
 * Side effects of a recognized hit, run before {@link recordScan} parks on
 * the result:
 *
 * 1. Stop the live stream — releasing the camera and its recording
 *    indicator. Holding it open behind the result surface would leave the
 *    hardware running with no visible stop control, so the hit itself
 *    releases it; "Scan again" reopens the camera from scratch.
 * 2. Auto-open a safe web link, but only inside an installed PWA. A
 *    `url`-kind scan whose payload clears the {@link autoOpenHref} safety
 *    check launches in a new tab so the common case — point, scan, go —
 *    needs no extra tap; in standalone, `window.open` hands it to the real
 *    browser without replacing the app. In a plain browser tab we skip the
 *    auto-open (the user is already browsing) and leave the result
 *    surface's link for them to tap. Anything unsafe or non-link is never
 *    launched. Even in a PWA a popup blocker may swallow this (it fires
 *    outside a fresh user gesture); that's fine — the link is still there.
 *
 * The physical work lives here in the effect, mirroring
 * {@link stopCameraEffect}; the state transition is the action.
 */
const finishScan = (
  state: DeepReadonly<ScannerState>,
  result: ScanResult,
): ScanResult => {
  stopStreamForResult(state, result);
  const href = autoOpenHref(result);
  if (href !== undefined && inStandalonePWA()) {
    window.open(href, '_blank', 'noopener,noreferrer');
  }
  return result;
};

/**
 * Finalize a scan on the first hit: run the {@link finishScan} side effects
 * (release the camera, auto-open a safe link), then hand off to
 * {@link recordScan} to park on the result.
 */
export const finishScanEffect = defineEffect([scannerStore], finishScan, {
  onSuccess: recordScan,
});

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
export const startDecoderEffect = defineEffect([decoderStore], createDecoder, {
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
  [scannerStore, decoderStore],
  teardownScanner,
  { onSuccess: endSession },
);
