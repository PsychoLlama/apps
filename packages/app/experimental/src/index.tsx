import { Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import {
  Callout,
  Code,
  Container,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
  Section,
  Text,
} from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import { createLogger } from '@lib/observability';
import IconAlert from 'virtual:icons/mdi/alert-circle-outline';
import {
  getBarcodeDetector,
  type BarcodeDetectorInstance,
  type BarcodePoint2D,
} from './barcode-detector';
import { scanner, useScannerActions } from './state';
import * as css from './scanner.css';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

const formatNumber = (value: number) => value.toFixed(1);

const formatPoint = (point: BarcodePoint2D) =>
  `(${formatNumber(point.x)}, ${formatNumber(point.y)})`;

const formatBoundingBox = (box: DOMRectReadOnly) =>
  `x: ${formatNumber(box.x)}, y: ${formatNumber(box.y)}, w: ${formatNumber(box.width)}, h: ${formatNumber(box.height)}`;

export const Experimental = () => {
  const actions = useScannerActions();

  let videoEl: HTMLVideoElement | undefined;
  let stream: MediaStream | undefined;
  let rafHandle: number | undefined;
  let detector: BarcodeDetectorInstance | undefined;
  let active = true;

  const start = async () => {
    const Detector = getBarcodeDetector();
    if (!Detector) {
      actions.markUnsupported();
      return;
    }

    try {
      const formats = await Detector.getSupportedFormats();
      if (!active) return;
      actions.markSupported(formats);
      detector = new Detector({ formats });
    } catch (error) {
      logger.error('failed to probe BarcodeDetector', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      actions.recordError(
        error instanceof Error
          ? error.message
          : 'Failed to probe BarcodeDetector.',
      );
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch (error) {
      logger.error('camera permission failed', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      actions.recordError(
        error instanceof Error ? error.message : 'Camera permission denied.',
      );
      return;
    }

    if (!active || !videoEl) {
      stream.getTracks().forEach((track) => track.stop());
      stream = undefined;
      return;
    }

    videoEl.srcObject = stream;
    await videoEl.play().catch(() => {});
    actions.markScanning();
    scheduleScan();
  };

  const scheduleScan = () => {
    rafHandle = requestAnimationFrame(() => {
      void runScan();
    });
  };

  const runScan = async () => {
    if (!active || !detector || !videoEl) return;
    if (videoEl.readyState < videoEl.HAVE_METADATA) {
      scheduleScan();
      return;
    }

    try {
      const detections = await detector.detect(videoEl);
      if (!active) return;
      const first = detections[0];
      if (first) actions.recordDetection(first);
    } catch (error) {
      logger.error('barcode detect threw', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    if (active) scheduleScan();
  };

  onMount(() => {
    void start();
  });

  onCleanup(() => {
    active = false;
    if (rafHandle !== undefined) cancelAnimationFrame(rafHandle);
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (videoEl) videoEl.srcObject = null;
  });

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Experimental" />
      <Section size={3}>
        <Container as="div" size={3}>
          <Flex as="div" direction="column" gap={5}>
            <Flex as="div" direction="column" gap={2}>
              <Heading as="h1" size={6}>
                Barcode scanner POC
              </Heading>
              <Text as="p" color="lowContrast">
                Live demo of the experimental <Code>BarcodeDetector</Code> API.
                Point the camera at a QR code or barcode.
              </Text>
            </Flex>

            <Switch>
              <Match when={scanner.status === 'unsupported'}>
                <Callout color="warning" icon={<IconAlert />}>
                  <Text as="span" weight="medium">
                    BarcodeDetector unavailable
                  </Text>
                  <Text as="span">
                    This browser does not expose the experimental
                    BarcodeDetector API. Try a recent Chromium-based browser on
                    Android or macOS.
                  </Text>
                </Callout>
              </Match>

              <Match when={scanner.status === 'error'}>
                <Callout color="danger" icon={<IconAlert />}>
                  <Text as="span" weight="medium">
                    Scanner error
                  </Text>
                  <Text as="span" selectable>
                    {scanner.errorMessage}
                  </Text>
                </Callout>
              </Match>

              <Match
                when={
                  scanner.status === 'requesting-camera' ||
                  scanner.status === 'scanning' ||
                  scanner.status === 'probing'
                }
              >
                <Flex as="div" direction="column" gap={4}>
                  <Flex as="div" class={css.viewport}>
                    <video
                      ref={(el) => (videoEl = el)}
                      class={css.video}
                      muted
                      playsinline
                    />
                  </Flex>

                  <DataListRoot orientation="vertical" size={2}>
                    <DataListItem>
                      <DataListLabel>Status</DataListLabel>
                      <DataListValue>{scanner.status}</DataListValue>
                    </DataListItem>
                    <DataListItem>
                      <DataListLabel>Supported formats</DataListLabel>
                      <DataListValue>
                        <Show
                          when={scanner.supportedFormats.length > 0}
                          fallback="—"
                        >
                          {scanner.supportedFormats.join(', ')}
                        </Show>
                      </DataListValue>
                    </DataListItem>
                    <DataListItem>
                      <DataListLabel>Raw value</DataListLabel>
                      <DataListValue>
                        {scanner.detection?.rawValue ?? '—'}
                      </DataListValue>
                    </DataListItem>
                    <DataListItem>
                      <DataListLabel>Format</DataListLabel>
                      <DataListValue>
                        {scanner.detection?.format ?? '—'}
                      </DataListValue>
                    </DataListItem>
                    <DataListItem>
                      <DataListLabel>Bounding box</DataListLabel>
                      <DataListValue>
                        {scanner.detection
                          ? formatBoundingBox(scanner.detection.boundingBox)
                          : '—'}
                      </DataListValue>
                    </DataListItem>
                    <DataListItem>
                      <DataListLabel>Corner points</DataListLabel>
                      <DataListValue>
                        {scanner.detection
                          ? scanner.detection.cornerPoints
                              .map(formatPoint)
                              .join(' → ')
                          : '—'}
                      </DataListValue>
                    </DataListItem>
                  </DataListRoot>
                </Flex>
              </Match>
            </Switch>
          </Flex>
        </Container>
      </Section>
    </Flex>
  );
};
