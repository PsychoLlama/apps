import MediaDevices, { supportsMediaDevices } from 'media-devices';
import type { DeepReadonly } from '@lib/state';
import { terminateDecoder } from './decoder';
import type { CameraErrorKind, ScannerState } from './store';

/**
 * `torch` is a constrainable property from the MediaStream Image Capture
 * spec — controllable on Android Chromium, but absent on iOS Safari and
 * Firefox. The DOM lib doesn't model it, so we augment the two surfaces
 * we touch: capability detection and the constraint we apply.
 */
declare global {
  interface MediaTrackCapabilities {
    torch?: boolean;
  }
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
}

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
 * Raised when a request is superseded while its permission prompt is
 * still open — the resolved stream has already been stopped, so the
 * lifecycle should unwind quietly rather than surface an error.
 */
export class CameraAborted extends Error {
  constructor() {
    super('Camera request superseded before it resolved');
    this.name = 'CameraAborted';
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
 * Open a camera session, guarded against supersession. A permission
 * prompt can stay open for seconds — long enough for the user to
 * navigate away — and `getUserMedia` can't be cancelled. So we snapshot
 * the session's {@link ScannerState.generation} before requesting and
 * re-check it once the stream resolves: if it changed, the request was
 * superseded, and we stop the now-orphaned stream rather than hand back
 * a live (uncancellable) camera.
 */
export const openCameraSession = async (
  state: DeepReadonly<ScannerState>,
): Promise<MediaStream> => {
  const generation = state.generation;
  const stream = await requestCamera();

  if (state.generation !== generation) {
    stream.getTracks().forEach((track) => track.stop());
    throw new CameraAborted();
  }

  return stream;
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
 * Release every resource a scanner session holds — the camera stream and
 * the decoder worker — in one call, so page unmount tears the session
 * down through a single effect. Safe in any lifecycle state: each step
 * no-ops when its resource is absent.
 */
export const teardownScanner = (state: DeepReadonly<ScannerState>): void => {
  stopStream(state);
  terminateDecoder(state);
};

/**
 * Whether the live camera exposes a controllable torch. Reads the video
 * track's reported capabilities — `getCapabilities` itself is missing on
 * some engines (older iOS Safari), hence the optional call. False when no
 * track, no capabilities API, or no torch.
 */
export const supportsTorch = (stream: MediaStream): boolean => {
  const [track] = stream.getVideoTracks();
  return track?.getCapabilities?.().torch === true;
};

/**
 * Drive the torch on the active stream and resolve with the applied
 * state. The light lives on the live track, so it goes dark on its own
 * when the stream stops — no separate teardown. A no-op (resolving with
 * the requested value) when nothing is streaming.
 */
export const setTorch = async (
  state: DeepReadonly<ScannerState>,
  on: boolean,
): Promise<boolean> => {
  const track = state.stream?.current.getVideoTracks()[0];
  if (track) await track.applyConstraints({ advanced: [{ torch: on }] });
  return on;
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
