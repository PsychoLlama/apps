import {
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
  type Component,
} from 'solid-js';
import { useEffect } from '@lib/state';
import { SiteHeader } from '@lib/shell';
import { Button, Callout, Container, Flex, Heading, Text } from '@lib/ui';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconProgressWrench from 'virtual:icons/mdi/progress-wrench';
import IconRefresh from 'virtual:icons/mdi/refresh';
import { CameraView } from './components/camera-view';
import {
  shutdownScannerEffect,
  startCameraEffect,
  startDecodingEffect,
  stopCameraEffect,
  toggleTorchEffect,
} from './bindings';
import { scanner, type CameraErrorKind } from './store';

/** User-facing copy for each failure mode. */
const ERROR_MESSAGES: Record<CameraErrorKind, string> = {
  'permission-denied':
    'Camera access was blocked. Allow the camera in your browser settings, then try again.',
  'no-camera': 'No camera found. Connect a camera and try again.',
  unsupported: "This browser can't reach the camera. Try another browser.",
  unknown: 'Something went wrong starting the camera. Try again.',
};

/** Landing pitch + the primary action that opens the camera. */
const Landing: Component<{ requesting: boolean; onStart: () => void }> = (
  props,
) => (
  <Flex as="div" direction="column" align="center" gap={5}>
    <Flex as="header" direction="column" align="center" gap={2}>
      <Heading as="h1" size={6} weight="medium" align="center">
        Scan a QR code
      </Heading>
      <Text as="p" size={2} color="lowContrast" align="center">
        Point your camera at a QR code. Nothing leaves your device.
      </Text>
    </Flex>

    <Button
      testId="start-scanning"
      size={3}
      disabled={props.requesting}
      onClick={() => props.onStart()}
    >
      <IconQrcodeScan width="20" height="20" aria-hidden="true" />
      {props.requesting ? 'Requesting camera…' : 'Start scanning'}
    </Button>

    <Callout color="warning" icon={<IconProgressWrench />}>
      <Text as="span" size={2}>
        Detection works — on-screen results land in a follow-up.
      </Text>
    </Callout>
  </Flex>
);

/** Failure surface — swaps in for the landing pitch when a request fails. */
const ScannerError: Component<{
  kind: CameraErrorKind;
  onRetry: () => void;
}> = (props) => (
  <Flex as="div" direction="column" align="center" gap={5}>
    <Flex as="header" direction="column" align="center" gap={2}>
      <Heading as="h1" size={6} weight="medium" align="center">
        Camera unavailable
      </Heading>
      <Text
        as="p"
        size={2}
        color="lowContrast"
        align="center"
        selectable={false}
      >
        {ERROR_MESSAGES[props.kind]}
      </Text>
    </Flex>

    {/* Retrying an unsupported browser is futile — only offer it when it might help. */}
    <Show when={props.kind !== 'unsupported'}>
      <Button testId="retry-scanning" size={3} onClick={() => props.onRetry()}>
        <IconRefresh width="20" height="20" aria-hidden="true" />
        Try again
      </Button>
    </Show>
  </Flex>
);

/**
 * Scanner app. Drives a camera session: the landing page opens the feed,
 * which then takes over the viewport full-bleed with a cancel control.
 * Errors swap the landing copy for a recovery message. Decoding the QR
 * code itself is still out of scope — this wires up the camera only.
 */
export const QrScanner = () => {
  const startCamera = useEffect(startCameraEffect);
  const stopCamera = useEffect(stopCameraEffect);
  const toggleTorch = useEffect(toggleTorchEffect);
  const startDecoding = useEffect(startDecodingEffect);
  const shutdown = useEffect(shutdownScannerEffect);

  // Preload the decoder worker + wasm across the whole scanner page so
  // the module is warm by the time the camera goes live; it outlives
  // individual camera sessions and is torn down only on unmount.
  onMount(() => void startDecoding());

  // Tear the whole page down in one dispatch on unmount: stop a live
  // stream, supersede a still-pending request, and terminate the decoder
  // worker. Safe in any state — each step no-ops when its resource is
  // absent.
  onCleanup(() => void shutdown());

  return (
    <Show
      when={scanner.status === 'streaming' && scanner.stream}
      fallback={
        <>
          <SiteHeader title="Scanner" />

          <Container as="main" size={1} px={4} py={6}>
            <Switch>
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
