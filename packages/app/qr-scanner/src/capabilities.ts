import MediaDevices, { supportsMediaDevices } from 'media-devices';
import type { DeepReadonly } from '@lib/state';
import type { CameraErrorKind, ScannerState } from './store';

/**
 * Constraints for the scanner feed: rear-facing camera (`environment`)
 * since you point the back of the phone at the code, and no audio — a
 * QR scanner has no use for the microphone.
 */
const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: 'environment' },
  audio: false,
};

/**
 * A camera failure we raise ourselves (rather than letting the browser
 * throw), carrying a pre-classified {@link CameraErrorKind}. Used for the
 * unsupported-browser case, which we detect before ever calling
 * `getUserMedia`.
 */
export class CameraError extends Error {
  readonly kind: CameraErrorKind;

  constructor(kind: CameraErrorKind) {
    super(`Camera unavailable: ${kind}`);
    this.name = 'CameraError';
    this.kind = kind;
  }
}

/**
 * Open a live camera stream for scanning. Guards on `mediaDevices`
 * support first — some browsers omit the API entirely on insecure
 * origins — then requests the rear camera.
 */
export const requestCamera = (): Promise<MediaStream> => {
  if (!supportsMediaDevices()) {
    return Promise.reject(new CameraError('unsupported'));
  }

  return MediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
};

/**
 * Stop every track on the active stream, releasing the camera (and its
 * recording indicator). Reads the stream straight off the store view; a
 * no-op when nothing is streaming.
 */
export const stopStream = (state: DeepReadonly<ScannerState>): void => {
  state.stream?.current.getTracks().forEach((track) => track.stop());
};

/**
 * Collapse the browser's assorted `getUserMedia` rejections into a
 * {@link CameraErrorKind}. `DOMException` names are the stable signal
 * here — messages are localized and vary by engine.
 */
export const classifyCameraError = (error: unknown): CameraErrorKind => {
  if (error instanceof CameraError) {
    return error.kind;
  }

  const name = error instanceof Error ? error.name : '';

  switch (name) {
    // Permission was refused — by the user, by policy, or by an insecure
    // context that rejects the grant outright.
    case 'NotAllowedError':
    case 'SecurityError':
      return 'permission-denied';

    // No device matched: nothing attached, or nothing that satisfies the
    // facing-mode constraint.
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'no-camera';

    default:
      return 'unknown';
  }
};
