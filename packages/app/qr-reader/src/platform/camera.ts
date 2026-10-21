import MediaDevices, { supportsMediaDevices } from 'media-devices';
import { createLogger, toError } from '@lib/observability';
import type { CameraErrorKind } from '../state/camera';

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

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Constraints for the reader feed: rear-facing camera (`environment`)
 * since you point the back of the phone at the code, and no audio — a
 * QR reader has no use for the microphone.
 *
 * Resolution is requested, not required (`ideal`): left unconstrained,
 * phones hand back a low default (e.g. 480×640) that smears small or
 * distant codes into an unreadable blur. Asking for 1080p gives the
 * decoder real detail to work with — it scans the frame at native
 * resolution — while `ideal` degrades gracefully to whatever the
 * hardware actually offers rather than throwing `OverconstrainedError`.
 */
const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
};

/** A live feed, paired with what its camera turned out to be capable of. */
export interface LiveCamera {
  /** The live stream to render and sample frames from. */
  stream: MediaStream;
  /** Whether the stream's camera exposes a controllable torch. */
  torch: boolean;
}

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
 * Stop every track on a stream, releasing the camera (and its recording
 * indicator).
 */
export const stopStream = (stream: MediaStream): void => {
  stream.getTracks().forEach((track) => track.stop());
};

/**
 * Open a live camera stream for scanning and report what it can do.
 * Guards on `mediaDevices` support first — some browsers omit the API
 * entirely on insecure origins — then requests the rear camera.
 *
 * Can't be cancelled: a permission prompt stays open as long as the user
 * leaves it. Whoever holds the stream stops it, however late it lands.
 */
export const openCamera = async (): Promise<LiveCamera> => {
  try {
    if (!supportsMediaDevices()) throw new CameraError('unsupported');

    const stream = await MediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
    const torch = supportsTorch(stream);
    logger.debug('Camera stream went live.', { torch });

    return { stream, torch };
  } catch (error) {
    logger.warn('Camera request failed.', {
      kind: classifyCameraError(error),
      error: toError(error),
    });

    throw error;
  }
};

/**
 * Whether the user has already granted camera permission, via the
 * Permissions API. Lets the reader skip the landing pitch and open the
 * feed straight away on a return visit where the grant still stands.
 *
 * The query itself is wrapped because not every engine recognizes the
 * `camera` permission descriptor — Firefox rejects it outright. A
 * rejection (or any non-`granted` state) resolves to `false`, falling back
 * to the manual landing button; this only ever *upgrades* the experience,
 * so an unknown answer is treated as "not granted."
 */
export const cameraPermissionGranted = async (): Promise<boolean> => {
  try {
    const status = await navigator.permissions.query({ name: 'camera' });
    return status.state === 'granted';
  } catch {
    return false;
  }
};

/**
 * Drive the torch on a live stream and resolve with the applied state. The
 * light lives on the live track, so it goes dark on its own when the stream
 * stops — no separate teardown. A no-op (resolving with the requested
 * value) when the stream has no video track.
 *
 * A rejection is logged here and rethrown: the caller swallows it, and a
 * torch that won't switch is a degraded nicety rather than an error worth
 * surfacing, but it shouldn't be invisible to diagnose either.
 */
export const setTorch = async (
  stream: MediaStream,
  on: boolean,
): Promise<boolean> => {
  const [track] = stream.getVideoTracks();

  try {
    if (track) await track.applyConstraints({ advanced: [{ torch: on }] });
  } catch (error) {
    logger.debug('Torch toggle was rejected.', { error: toError(error) });
    throw error;
  }

  return on;
};
