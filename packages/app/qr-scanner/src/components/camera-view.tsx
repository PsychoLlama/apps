import { onCleanup, onMount, Show, type Component } from 'solid-js';
import { useEffect } from '@lib/state';
import { Flex, IconButton } from '@lib/ui';
import IconClose from 'virtual:icons/mdi/close';
import IconFlashlight from 'virtual:icons/mdi/flashlight';
import IconFlashlightOff from 'virtual:icons/mdi/flashlight-off';
import { finishScanEffect } from '../bindings';
import { startCaptureLoop } from '../capture-loop';
import { scanner } from '../store';
import * as css from './camera-view.css';

interface CameraViewProps {
  /** The live stream to render. Stable for the life of the session. */
  stream: MediaStream;
  /** Invoked when the user dismisses the feed. */
  onCancel: () => void;
  /** Whether the device exposes a torch — gates the control's visibility. */
  torchSupported: boolean;
  /** Whether the torch is currently lit. */
  torchOn: boolean;
  /** Toggle the torch on or off. */
  onToggleTorch: () => void;
}

/**
 * Full-viewport live camera feed with an overlaid cancel control. Runs
 * the decode loop: each sampled frame is grabbed as an `ImageBitmap` and
 * handed to the decoder worker, one in flight at a time. On the first hit
 * it finalizes the scan — recording the result and releasing the camera —
 * which swaps the result surface in for the feed.
 */
export const CameraView: Component<CameraViewProps> = (props) => {
  const finishScan = useEffect(finishScanEffect);
  let videoEl: HTMLVideoElement | undefined;

  onMount(() => {
    // Start sampling immediately; the loop reads the decoder per frame, so
    // it tolerates the worker preload still being in flight and begins
    // decoding the moment it attaches.
    if (videoEl) {
      onCleanup(
        startCaptureLoop(videoEl, () => scanner.decoder?.current, finishScan),
      );
    }
  });

  return (
    <Flex as="section" class={css.viewport}>
      <video
        autoplay
        playsinline
        data-testid="camera-feed"
        aria-label="Live camera feed"
        class={css.video}
        ref={(video) => {
          videoEl = video;
          // Both must be set as DOM properties, not attributes:
          // `srcObject` has no attribute form, and the `muted` attribute
          // is ignored by autoplay gating (iOS Safari especially) — only
          // the property mutes. Setting them here, before insertion,
          // keeps unattended autoplay allowed.
          video.muted = true;
          video.srcObject = props.stream;
        }}
      />

      <Flex
        as="div"
        testId="scan-reticle"
        aria-hidden="true"
        class={css.reticle}
      >
        <Flex as="div" class={css.corners.topLeft} />
        <Flex as="div" class={css.corners.topRight} />
        <Flex as="div" class={css.corners.bottomLeft} />
        <Flex as="div" class={css.corners.bottomRight} />
      </Flex>

      <Flex as="div" testId="scanner-controls" gap={4} class={css.controls}>
        <IconButton
          testId="cancel-scanning"
          aria-label="Stop scanning"
          size={4}
          radius="full"
          variant="ghost"
          color="neutral"
          onClick={() => props.onCancel()}
        >
          <IconClose width="24" height="24" aria-hidden="true" />
        </IconButton>

        <Show when={props.torchSupported}>
          <IconButton
            testId="toggle-torch"
            aria-label={
              props.torchOn ? 'Turn off flashlight' : 'Turn on flashlight'
            }
            aria-pressed={props.torchOn}
            size={4}
            radius="full"
            variant="ghost"
            color={props.torchOn ? 'accent' : 'neutral'}
            onClick={() => props.onToggleTorch()}
          >
            <Show
              when={props.torchOn}
              fallback={
                <IconFlashlightOff width="24" height="24" aria-hidden="true" />
              }
            >
              <IconFlashlight width="24" height="24" aria-hidden="true" />
            </Show>
          </IconButton>
        </Show>
      </Flex>
    </Flex>
  );
};
