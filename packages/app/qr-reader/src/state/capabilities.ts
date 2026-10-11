import MediaDevices, { supportsMediaDevices } from 'media-devices';
import { createLogger, toError } from '@lib/observability';
import type { DeepReadonly } from '@lib/state';
import type { Navigator } from '@solidjs/router';
import { resolveScanTarget } from '../scan-link';
import type { ScanResult } from '../worker/rpc';
import type { CameraErrorKind, LiveCamera } from './camera';

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
 * Constraints for the scanner feed: rear-facing camera (`environment`)
 * since you point the back of the phone at the code, and no audio — a
 * QR scanner has no use for the microphone.
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
 * indicator). A no-op when nothing is streaming.
 *
 * Not signal-first, because it isn't only a capability: the stream cell
 * hands it straight to its `drop` hook, so scope teardown and a deliberate
 * cancel release the hardware through the same call.
 */
export const stopStream = (stream: MediaStream | null): void => {
  stream?.getTracks().forEach((track) => track.stop());
};

/**
 * Open a live camera stream for scanning and report what it can do.
 * Guards on `mediaDevices` support first — some browsers omit the API
 * entirely on insecure origins — then requests the rear camera.
 *
 * Cancellation is cooperative: a permission prompt can stay open for
 * seconds, long enough for the page to unmount, and `getUserMedia` can't be
 * cancelled. So a stream that lands after the abort is stopped here rather
 * than left running with nothing holding it.
 */
export const openCamera = async (signal: AbortSignal): Promise<LiveCamera> => {
  try {
    if (!supportsMediaDevices()) throw new CameraError('unsupported');

    const stream = await MediaDevices.getUserMedia(CAMERA_CONSTRAINTS);

    // The request can't be interrupted, so a stream that arrives after the
    // abort has to be stopped here or the camera stays live.
    if (signal.aborted) stopStream(stream);
    signal.throwIfAborted();

    const torch = supportsTorch(stream);
    logger.debug('Camera stream went live.', { torch });
    return { stream, torch };
  } catch (error) {
    // An abort is ordinary teardown — the page went away mid-prompt — so
    // it isn't worth reporting as a failure.
    if (!signal.aborted) {
      logger.warn('Camera request failed.', {
        kind: classifyCameraError(error),
        error: toError(error),
      });
    }

    throw error;
  }
};

/**
 * Release the camera. The capability face of {@link stopStream}, for the
 * sagas that stop a feed on purpose — a cancel, or a recognized hit.
 */
export const releaseCamera = (
  _signal: AbortSignal,
  stream: MediaStream | null,
): void => stopStream(stream);

/**
 * Whether the user has already granted camera permission, via the
 * Permissions API. Lets the scanner skip the landing pitch and open the
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
 * Drive the torch on the active stream and resolve with the applied
 * state. The light lives on the live track, so it goes dark on its own
 * when the stream stops — no separate teardown. A no-op (resolving with
 * the requested value) when nothing is streaming.
 *
 * A rejection is logged here and rethrown: the caller swallows it, and a
 * torch that won't switch is a degraded nicety rather than an error worth
 * surfacing, but it shouldn't be invisible to diagnose either.
 */
export const setTorch = async (
  _signal: AbortSignal,
  stream: MediaStream | null,
  on: boolean,
): Promise<boolean> => {
  const track = stream?.getVideoTracks()[0];

  try {
    if (track) await track.applyConstraints({ advanced: [{ torch: on }] });
  } catch (error) {
    logger.debug('Torch toggle was rejected.', { error: toError(error) });
    throw error;
  }

  return on;
};

/**
 * Fire a haptic pulse as tactile confirmation of a recognized code.
 * Guards on the Vibration API, which desktop browsers and iOS Safari
 * don't implement — a silent no-op there rather than a thrown call.
 */
export const vibrate = (
  _signal: AbortSignal,
  pattern: VibratePattern,
): void => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

/**
 * Whether the app is running inside an installed PWA window rather than a
 * browser tab. Gates the scanned-link auto-open: only in standalone does
 * `window.open` hand the link to the real browser without replacing the
 * app, and only there is auto-navigating sensible — in a tab the user is
 * already browsing, we leave the result surface's link for them to tap.
 *
 * Tests the installable `display-mode`s the manifest can resolve to. The
 * media feature is Baseline-wide since 2020; iOS reports it from Safari
 * 15.4 on, so an older iOS home-screen app simply doesn't auto-open and
 * falls back to the rendered link — a benign miss, never a wrong navigation.
 */
const inStandalonePWA = (): boolean =>
  ['standalone', 'minimal-ui', 'fullscreen'].some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  );

/**
 * Auto-launch a recognized link, but only inside an installed PWA. A
 * `url`-kind scan whose payload clears the {@link resolveScanTarget} safety
 * check launches so the common case — point, scan, go — needs no extra tap.
 * A link back into our own origin routes in-app through the router (no
 * reload, no new tab, session intact); anything else opens a new browser
 * tab, handing off to the real browser without replacing the app.
 *
 * In a plain browser tab we skip the auto-launch — the user is already
 * browsing — and leave the result surface's link for them to tap. Anything
 * unsafe or non-link is never launched. Even in a PWA a popup blocker may
 * swallow the new tab (it fires outside a fresh user gesture); that's fine,
 * the link is still there.
 */
export const launchScanTarget = (
  _signal: AbortSignal,
  result: DeepReadonly<ScanResult>,
  navigate: Navigator,
): void => {
  if (!inStandalonePWA()) return;

  const target = resolveScanTarget(result);
  if (target?.kind === 'internal') {
    navigate(target.path);
  } else if (target?.kind === 'external') {
    window.open(target.href, '_blank', 'noopener,noreferrer');
  }
};
