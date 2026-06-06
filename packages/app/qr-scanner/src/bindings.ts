import { defineAction, defineEffect, ref } from '@lib/state';
import {
  CameraAborted,
  classifyCameraError,
  openCameraSession,
  stopStream,
} from './capabilities';
import { scannerStore } from './store';

/** Enter the requesting state, bumping the generation and clearing any prior error. */
export const beginRequest = defineAction([scannerStore], (state) => {
  state.status = 'requesting';
  state.error = null;
  state.generation += 1;
});

/** Attach a freshly opened stream and go live. */
export const activateStream = defineAction(
  [scannerStore],
  (state, stream: MediaStream) => {
    state.status = 'streaming';
    state.stream = ref(stream);
    state.error = null;
  },
);

/** Record a failed request, normalizing the cause for the UI. */
export const failCamera = defineAction(
  [scannerStore],
  (state, error: Error) => {
    // A superseded request already had its state torn down by
    // `abortRequest` (and a newer request may now be in flight), so leave
    // state untouched — don't clobber it with a spurious error.
    if (error instanceof CameraAborted) return;

    state.status = 'error';
    state.error = classifyCameraError(error);
    state.stream = null;
  },
);

/** Return to the idle landing state. Assumes the stream is already stopped. */
export const resetScanner = defineAction([scannerStore], (state) => {
  state.status = 'idle';
  state.stream = null;
  state.error = null;
});

/**
 * Abandon an in-flight request — used when the scanner unmounts while a
 * permission prompt is still open. Bumping the generation signals the
 * pending {@link openCameraSession} to stop its stream once it resolves
 * rather than store an orphaned, uncancellable camera.
 */
export const abortRequest = defineAction([scannerStore], (state) => {
  state.status = 'idle';
  state.stream = null;
  state.error = null;
  state.generation += 1;
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
