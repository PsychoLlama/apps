import { Match, Show, Switch } from 'solid-js';
import { useAction, useClientResource, useValue } from '@lib/effects/solid';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { Container } from '@lib/ui';
import { CameraSession } from '../components/camera-session';
import { Landing } from '../components/landing';
import { ReaderError } from '../components/reader-error';
import { ScanResult } from '../components/scan-result';
import { $autoStartScan, $decoder } from '../effects';
import { $camera, $scanRequested, wantsCamera } from '../state';

/**
 * QR Reader home. Drives a camera session: the landing page opens the feed,
 * which then takes over the viewport full-bleed with a cancel control.
 * Errors swap the landing copy for a recovery message. On a recognized
 * code the result surface replaces the feed, showing the raw payload with
 * a control to scan again.
 *
 * Holding the plans is the only lifecycle wiring here: the camera is held
 * while the session wants it, and the decoder worker for the whole page.
 * Releasing them stops the stream and terminates the worker.
 */
const QrReader = () => {
  const camera = useValue($camera);
  const start = useAction($scanRequested);

  // Neither the worker nor the Permissions API can run during SSG, so both
  // start once the client mounts. They're independent: the feed is usable
  // whether or not the decoder has landed, and vice versa. The worker is
  // warm by the time the camera goes live, and outlives camera sessions.
  useClientResource($decoder);
  useClientResource($autoStartScan);

  return (
    <>
      <Show when={wantsCamera(camera())}>
        <CameraSession />
      </Show>

      <Show when={camera().status !== 'streaming'}>
        <Frame>
          <SiteHeader />

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
                  {(kind) => <ReaderError kind={kind()} onRetry={start} />}
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
      </Show>
    </>
  );
};

export default QrReader;
