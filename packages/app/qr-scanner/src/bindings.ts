import { defineAction, defineEffect, ref } from '@lib/state';
import { classifyCameraError, requestCamera, stopStream } from './capabilities';
import { scannerStore } from './store';

/** Enter the requesting state, clearing any prior error. */
export const beginRequest = defineAction([scannerStore], (state) => {
  state.status = 'requesting';
  state.error = null;
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
 * Open the camera and surface the result through the session lifecycle:
 * `requesting` on start, `streaming` on success, `error` on failure.
 */
export const startCameraEffect = defineEffect([], requestCamera, {
  onStart: beginRequest,
  onSuccess: activateStream,
  onFailure: failCamera,
});

/**
 * Tear down the active stream and return to idle. `stopStream` runs
 * first (releasing the hardware), then `resetScanner` clears the state —
 * order matters, since the reset drops the stream reference the stop
 * needs.
 */
export const stopCameraEffect = defineEffect([scannerStore], stopStream, {
  onSuccess: resetScanner,
});
