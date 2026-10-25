import { Show, type Component } from 'solid-js';
import { useAction, useClientValue, useValue } from '@lib/effects/solid';
import { $liveCamera, $toggleTorch } from '../effects';
import { $camera, $scanStopped } from '../state';
import { CameraView } from './camera-view';

/**
 * Holds the camera for as long as it's mounted, rendering the live feed
 * once it opens and nothing before. Mount it while the session wants the
 * camera; unmounting is what releases it.
 */
export const CameraSession: Component = () => {
  const camera = useValue($camera);
  const stream = useClientValue($liveCamera);
  const stopScan = useAction($scanStopped);
  const toggleTorch = useAction($toggleTorch);

  return (
    // A failed request yields no stream, and lands as `error` on the
    // session, which unmounts this.
    <Show when={stream()}>
      {(live) => (
        <CameraView
          stream={live()}
          onCancel={stopScan}
          torchSupported={camera().torch.supported}
          torchOn={camera().torch.on}
          onToggleTorch={() => toggleTorch(!camera().torch.on)}
        />
      )}
    </Show>
  );
};
