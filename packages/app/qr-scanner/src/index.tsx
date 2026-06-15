import { Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import { useEffect } from '@lib/state';
import { SiteHeader } from '@lib/shell';
import { Container } from '@lib/ui';
import { CameraView } from './components/camera-view';
import { Landing } from './components/landing';
import { ScannerError } from './components/scanner-error';
import { ScanResult } from './components/scan-result';
import {
  shutdownScannerEffect,
  startCameraEffect,
  startDecoderEffect,
  stopCameraEffect,
  toggleTorchEffect,
} from './bindings';
import { cameraPermissionGranted } from './capabilities';
import { scanner } from './store';

/**
 * Scanner app. Drives a camera session: the landing page opens the feed,
 * which then takes over the viewport full-bleed with a cancel control.
 * Errors swap the landing copy for a recovery message. On a recognized
 * code the result surface replaces the feed, showing the raw payload with
 * a control to scan again.
 */
export const QrScanner = () => {
  const startCamera = useEffect(startCameraEffect);
  const stopCamera = useEffect(stopCameraEffect);
  const toggleTorch = useEffect(toggleTorchEffect);
  const createDecoder = useEffect(startDecoderEffect);
  const shutdown = useEffect(shutdownScannerEffect);

  // Latched on unmount so the async permission probe below can tell the
  // page is gone and skip auto-starting the camera under a torn-down view.
  let cancelled = false;

  // Preload the decoder worker + wasm across the whole scanner page so
  // the module is warm by the time the camera goes live; it outlives
  // individual camera sessions and is torn down only on unmount.
  onMount(() => {
    void createDecoder();

    // On a return visit where camera permission already stands, skip the
    // landing pitch and open the feed straight away. The probe resolves
    // async, so latch onto this mount and the session's current generation
    // and bail if either moved: a late resolve must not reopen the camera
    // under an unmounted page, nor start a request over a session the user
    // has since driven. Every request start bumps the generation (and a
    // scan, cancel, or error is always downstream of one), so a still-
    // matching generation means an untouched fresh mount.
    const generation = scanner.generation;
    void cameraPermissionGranted().then((granted) => {
      if (granted && !cancelled && scanner.generation === generation) {
        void startCamera();
      }
    });
  });

  // Tear the whole page down in one dispatch on unmount: stop a live
  // stream, supersede a still-pending request, and terminate the decoder
  // worker. Safe in any state — each step no-ops when its resource is
  // absent.
  onCleanup(() => {
    cancelled = true;
    void shutdown();
  });

  return (
    <Show
      when={scanner.status === 'streaming' && scanner.stream}
      fallback={
        <>
          <SiteHeader title="Scanner" />

          <Container as="main" size={1} px={4} py={6}>
            <Switch>
              <Match when={scanner.result}>
                {(result) => (
                  <ScanResult
                    text={result().text}
                    kind={result().kind}
                    details={result().details}
                    onRetry={() => void startCamera()}
                  />
                )}
              </Match>
              <Match when={scanner.status === 'error' && scanner.error}>
                {(kind) => (
                  <ScannerError
                    kind={kind()}
                    onRetry={() => void startCamera()}
                  />
                )}
              </Match>
              <Match when={true}>
                <Landing
                  requesting={scanner.status === 'requesting'}
                  onStart={() => void startCamera()}
                />
              </Match>
            </Switch>
          </Container>
        </>
      }
    >
      {(stream) => (
        <CameraView
          stream={stream().current}
          onCancel={() => stopCamera()}
          torchSupported={scanner.torch.supported}
          torchOn={scanner.torch.on}
          onToggleTorch={() => void toggleTorch(!scanner.torch.on)}
        />
      )}
    </Show>
  );
};
