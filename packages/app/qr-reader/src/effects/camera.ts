import { collect, resource } from '@lib/effects';
import {
  cameraPermissionGranted,
  classifyCameraError,
  openCamera,
  setTorch,
  stopStream,
} from '../platform/camera';
import {
  $camera,
  $cameraFailed,
  $cameraOpened,
  $scanRequested,
  $torchToggled,
} from '../state';

/**
 * Open the camera for as long as the plan is held, yielding the live
 * stream, or `null` if the request failed. Either outcome lands on
 * `$camera` (`streaming` or `error`), since the UI renders both.
 *
 * Hold it while {@link wantsCamera} is true. Leaving that state, whether by
 * a cancel, a hit, or the page going away, releases it, which stops the
 * stream. A permission prompt that resolves after the release is stopped
 * the same way: the release waits for the request to settle.
 */
export const $liveCamera = collect(
  [$cameraOpened, $cameraFailed],
  async (cameraOpened, cameraFailed) => {
    try {
      const live = await openCamera();
      cameraOpened(live.torch);

      return resource<MediaStream | null, void>(live.stream, () =>
        stopStream(live.stream),
      );
    } catch (error) {
      // Reported by the platform, which has the context to describe it.
      cameraFailed(classifyCameraError(error));
      return resource<MediaStream | null, void>(null, () => {});
    }
  },
);

/**
 * Request the camera unprompted on a return visit where permission already
 * stands, skipping the landing pitch. Client-only: the Permissions API
 * can't run during pre-render.
 *
 * The probe resolves async, so the session is checked afterwards: a user
 * who started, cancelled, or scanned in the meantime has moved it on, and
 * reopening the camera under them would be an unasked-for surprise. Only a
 * still-pristine session auto-starts.
 */
export const $autoStartScan = collect(
  [$camera, $scanRequested],
  async (camera, scanRequested) => {
    if (!(await cameraPermissionGranted())) return;
    if (camera.status !== 'idle' || camera.result) return;

    scanRequested();
  },
);

/**
 * Toggle the torch on the live stream. The flag only advances once the
 * hardware confirms, so a rejected `applyConstraints` leaves the button
 * reflecting reality. Failures are swallowed: a torch that won't switch is a
 * degraded nicety, not an error worth surfacing.
 */
export const $toggleTorch = collect(
  [$liveCamera, $torchToggled],
  (stream, torchToggled) => async (on: boolean) => {
    if (!stream) return;

    try {
      torchToggled(await setTorch(stream, on));
    } catch {
      // Logged by the platform. Nothing changed, so nothing to commit.
    }
  },
);
