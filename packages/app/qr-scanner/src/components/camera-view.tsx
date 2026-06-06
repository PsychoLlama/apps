import type { Component } from 'solid-js';
import { Flex, IconButton } from '@lib/ui';
import IconClose from 'virtual:icons/mdi/close';
import * as css from './camera-view.css';

interface CameraViewProps {
  /** The live stream to render. Stable for the life of the session. */
  stream: MediaStream;
  /** Invoked when the user dismisses the feed. */
  onCancel: () => void;
}

/**
 * Full-viewport live camera feed with an overlaid cancel control. Decode
 * logic lands in a follow-up; for now this just shows the picture and
 * lets the user back out.
 */
export const CameraView: Component<CameraViewProps> = (props) => (
  <Flex as="section" class={css.viewport}>
    <video
      autoplay
      playsinline
      aria-label="Live camera feed"
      class={css.video}
      ref={(video) => {
        // Both must be set as DOM properties, not attributes: `srcObject`
        // has no attribute form, and the `muted` attribute is ignored by
        // autoplay gating (iOS Safari especially) — only the property
        // mutes. Setting them here, before insertion, keeps unattended
        // autoplay allowed.
        video.muted = true;
        video.srcObject = props.stream;
      }}
    />

    <Flex as="div" class={css.controls}>
      <IconButton
        testId="cancel-scanning"
        aria-label="Stop scanning"
        size={4}
        radius="full"
        variant="solid"
        color="neutral"
        onClick={() => props.onCancel()}
      >
        <IconClose width="24" height="24" aria-hidden="true" />
      </IconButton>
    </Flex>
  </Flex>
);
