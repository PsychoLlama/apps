import { createEffect, onCleanup, type Component } from 'solid-js';
import { useClientValue } from '@lib/effects/solid';
import { startCaptureLoop } from '../capture-loop';
import { $decoder } from '../effects';
import type { ScanResult } from '../worker/rpc';

interface DecodeLoopProps {
  /** The playing feed to sample frames from. */
  video: HTMLVideoElement;
  /** Invoked once, with the first code recognized. */
  onHit: (result: ScanResult) => void;
}

/**
 * Runs the decode loop against a feed while mounted, starting once the
 * decoder worker is live. Renders nothing. A worker that fails to start
 * reaches the error boundary.
 */
export const DecodeLoop: Component<DecodeLoopProps> = (props) => {
  const decoder = useClientValue($decoder);

  createEffect(() => {
    const connection = decoder();
    if (!connection) return;

    onCleanup(startCaptureLoop(props.video, connection, props.onHit));
  });

  return null;
};
