import { onCleanup, onMount, Show, type Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useEffect } from '@lib/state';
import { Flex, IconButton } from '@lib/ui';
import IconClose from 'virtual:icons/mdi/close';
import IconFlashlight from 'virtual:icons/mdi/flashlight';
import IconFlashlightOff from 'virtual:icons/mdi/flashlight-off';
import { finishScanEffect } from '../bindings';
import { startCaptureLoop } from '../capture-loop';
import { decoder } from '../decoder-store';
import * as css from './camera-view.css';
import { createLogger, toError } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

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
  const navigate = useNavigate();
  let videoEl: HTMLVideoElement | undefined;

  onMount(() => {
    const video = videoEl;
    if (!video) return;

    // Attach the stream here, not in the ref: WebKit drops `srcObject` set
    // on a detached element, leaving the feed with no source and play()
    // rejecting. Setting it once the element is connected makes it stick.
    video.srcObject = props.stream;

    // Start sampling immediately; the loop reads the decoder per frame, so
    // it tolerates the worker preload still being in flight and begins
    // decoding the moment it attaches.
    onCleanup(
      startCaptureLoop(
        video,
        () => decoder.connection?.current,
        (result) => finishScan({ result, navigate }),
      ),
    );
  });

  return (
    <Flex
      as="section"
      class={css.viewport}
      // The stage is an opaque dark surface in *both* page themes (black
      // backdrop + dimmed feed), so force the dark color scheme on the
      // subtree. Overlay controls resolve their color *and* structural
      // (shadow/filter) tokens to the dark-mode values and stay legible —
      // otherwise a light-theme `neutral` button paints dark-on-dark.
      data-color-scheme="dark"
    >
      <video
        autoplay
        playsinline
        data-testid="camera-feed"
        aria-label="Live camera feed"
        class={css.video}
        on:loadedmetadata={(event) => {
          // Play once the freshly attached stream is playable. A
          // synchronous attempt right after assigning `srcObject` loses
          // the race on iOS — the source isn't ready yet — so wait for
          // the metadata to land.
          void event.currentTarget.play().then(
            () => logger.debug('Camera feed playing.'),
            (error) =>
              logger.warn('Camera feed failed to play.', {
                error: toError(error),
              }),
          );
        }}
        ref={(video) => {
          videoEl = video;
          // Set as DOM properties, before insertion: the `muted` attribute
          // is ignored by autoplay gating (iOS Safari especially) — only
          // the property mutes — and both flags must be in place before the
          // element goes live to keep unattended autoplay allowed.
          video.muted = true;
          // srcObject and play() wait for onMount, once the element is
          // attached — WebKit drops srcObject set on a detached element.
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

      <Flex as="div" testId="scanner-controls" class={css.controls}>
        <IconButton
          testId="cancel-scanning"
          aria-label="Cancel"
          size={3}
          variant="outline"
          color="neutral"
          radius="full"
          onClick={() => props.onCancel()}
        >
          <IconClose width="24" height="24" aria-hidden="true" />
        </IconButton>

        <Show when={props.torchSupported}>
          <IconButton
            testId="toggle-torch"
            aria-label="Toggle flash"
            aria-pressed={props.torchOn}
            size={3}
            variant="outline"
            color={props.torchOn ? 'accent' : 'neutral'}
            radius="full"
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
