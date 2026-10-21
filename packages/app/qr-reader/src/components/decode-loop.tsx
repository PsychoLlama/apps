import { createEffect, onCleanup, type Component } from 'solid-js';
import { useClientResource } from '@lib/effects/solid';
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
 * Runs the decode loop against a feed while mounted. Renders nothing, and
 * suspends until the decoder worker is live; put it under its own
 * `Suspense` so the feed shows meanwhile. A worker that fails to start
 * reaches the error boundary.
 */
export const DecodeLoop: Component<DecodeLoopProps> = (props) => {
  const decoder = useClientResource($decoder);

  createEffect(() => {
    const connection = decoder();
    if (!connection) return;

    onCleanup(startCaptureLoop(props.video, connection, props.onHit));
  });

  return null;
};
