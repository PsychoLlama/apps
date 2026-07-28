import { Match, onMount, Show, Switch } from 'solid-js';
import { useAnchor, useRun, useValue } from '@lib/state-next';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { Container } from '@lib/ui';
import { CameraView } from './components/camera-view';
import { Landing } from './components/landing';
import { ScannerError } from './components/scanner-error';
import { ScanResult } from './components/scan-result';
import {
  autoStartScanSaga,
  cameraStore,
  preloadDecoderSaga,
  reportSagaFailure,
  scannerScope,
  startScanSaga,
  stopScanSaga,
  streamCell,
  toggleTorchSaga,
} from './state';

/**
 * Scanner app. Drives a camera session: the landing page opens the feed,
 * which then takes over the viewport full-bleed with a cancel control.
 * Errors swap the landing copy for a recovery message. On a recognized
 * code the result surface replaces the feed, showing the raw payload with
 * a control to scan again.
 *
 * The anchor is the only lifecycle wiring here: releasing it on cleanup
 * stops the stream, terminates the decoder worker, and supersedes a request
 * still waiting on its permission prompt.
 */
export const QrScanner = () => {
  useAnchor(scannerScope);
  const camera = useValue(cameraStore);
  const stream = useValue(streamCell);
  const startScan = useRun(startScanSaga);
  const autoStart = useRun(autoStartScanSaga);
  const stopScan = useRun(stopScanSaga);
  const toggleTorch = useRun(toggleTorchSaga);
  const preloadDecoder = useRun(preloadDecoderSaga);

  const start = () =>
    void startScan().catch(reportSagaFailure('The camera start saga failed.'));

  onMount(() => {
    // Neither the worker nor the Permissions API can run during SSG, so both
    // start once the client mounts. They're independent: the feed is usable
    // whether or not the decoder has landed, and vice versa.
    //
    // The worker is preloaded across the whole scanner page so its wasm is
    // warm by the time the camera goes live; it outlives individual camera
    // sessions and is torn down only with the scope.
    void preloadDecoder().catch(
      reportSagaFailure('The decoder preload saga failed.'),
    );
    void autoStart().catch(
      reportSagaFailure('The camera auto-start saga failed.'),
    );
  });

  return (
    <Show
      when={camera().status === 'streaming' && stream()}
      fallback={
        <Frame>
          <SiteHeader title="Scanner" />

          <FrameBody>
            <Container as="div" size={1}>
              <Switch>
                <Match when={camera().result}>
                  {(result) => (
                    <ScanResult
                      text={result().text}
                      kind={result().kind}
                      details={result().details}
                      onRetry={start}
                    />
                  )}
                </Match>
                <Match when={camera().status === 'error' && camera().error}>
                  {(kind) => <ScannerError kind={kind()} onRetry={start} />}
                </Match>
                <Match when={true}>
                  <Landing
                    requesting={camera().status === 'requesting'}
                    onStart={start}
                  />
                </Match>
              </Switch>
            </Container>
          </FrameBody>
        </Frame>
      }
    >
      {(live) => (
        <CameraView
          stream={live()}
          onCancel={() =>
            void stopScan().catch(
              reportSagaFailure('The camera stop saga failed.'),
            )
          }
          torchSupported={camera().torch.supported}
          torchOn={camera().torch.on}
          onToggleTorch={() =>
            void toggleTorch(!camera().torch.on).catch(
              reportSagaFailure('The torch toggle saga failed.'),
            )
          }
        />
      )}
    </Show>
  );
};
