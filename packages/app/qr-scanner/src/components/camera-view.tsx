import { onCleanup, onMount, Show, type Component } from 'solid-js';
import { useAction } from '@lib/state';
import { Flex, IconButton } from '@lib/ui';
import IconClose from 'virtual:icons/mdi/close';
import IconFlashlight from 'virtual:icons/mdi/flashlight';
import IconFlashlightOff from 'virtual:icons/mdi/flashlight-off';
import { recordScan } from '../bindings';
import { requestDecode } from '../decoder';
import { scanner } from '../store';
import { onVideoFrame } from '../video-frames';
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
 * handed to the decoder worker, one in flight at a time. On the first
 * hit it records the result and stops sampling — the feed keeps
 * streaming so the user stays oriented.
 */
export const CameraView: Component<CameraViewProps> = (props) => {
  const record = useAction(recordScan);
  let videoEl: HTMLVideoElement | undefined;

  onMount(() => {
    const decoder = scanner.decoder?.current;
    if (!decoder || !videoEl) return;
    const video = videoEl;

    // Back-pressure: hold a single frame in flight so we never queue
    // decodes faster than the worker drains them. Frames sampled while
    // one is pending are simply skipped — the next tick grabs a fresher
    // one anyway.
    let inFlight = false;

    const unsubscribe = onVideoFrame(video, () => {
      if (inFlight) return;
      inFlight = true;
      void (async () => {
        try {
          const result = await requestDecode(
            decoder,
            await createImageBitmap(video),
          );
          if (result) {
            record(result);
            unsubscribe();
          }
        } catch {
          // A dropped frame (grab failed, worker mid-teardown) is no
          // cause for alarm — the next tick tries again.
        } finally {
          inFlight = false;
        }
      })();
    });

    onCleanup(unsubscribe);
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
