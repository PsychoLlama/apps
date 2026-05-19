import { Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import {
  Button,
  Callout,
  Card,
  Container,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
  Text,
} from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import { createLogger } from '@lib/observability';
import IconAlert from 'virtual:icons/mdi/alert-circle-outline';
import IconRestart from 'virtual:icons/mdi/restart';
import {
  getBarcodeDetector,
  type BarcodeDetectorInstance,
  type BarcodePoint2D,
} from './barcode-detector';
import { parsePayload } from './parsers';
import { ParsedPayloadView } from './payload';
import { scanner, useScannerActions } from './state';
import * as css from './scanner.css';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

const VIBRATION_MS = 120;

const formatNumber = (value: number) => value.toFixed(1);

const formatPoint = (point: BarcodePoint2D) =>
  `(${formatNumber(point.x)}, ${formatNumber(point.y)})`;

const formatBoundingBox = (box: DOMRectReadOnly) =>
  `x: ${formatNumber(box.x)}, y: ${formatNumber(box.y)}, w: ${formatNumber(box.width)}, h: ${formatNumber(box.height)}`;

const buildPolygonPoints = (points: ReadonlyArray<BarcodePoint2D>) =>
  points.map((point) => `${point.x},${point.y}`).join(' ');

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
    if (scanner.status !== 'scanning') return;
    if (videoEl.readyState < videoEl.HAVE_METADATA) {
      scheduleScan();
      return;
    }

    try {
      const detections = await detector.detect(videoEl);
      if (!active || scanner.status !== 'scanning') return;
      const first = detections[0];
      if (first) {
        handleDetection(first);
        return;
      }
    } catch (error) {
      logger.error('barcode detect threw', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    scheduleScan();
  };

  const handleDetection = (
    raw: NonNullable<
      Awaited<ReturnType<BarcodeDetectorInstance['detect']>>[number]
    >,
  ) => {
    if (!videoEl) return;
    const parsed = parsePayload(raw.rawValue);
    const videoSize = {
      width: videoEl.videoWidth,
      height: videoEl.videoHeight,
    };

    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(VIBRATION_MS);
    }

    videoEl.pause();

    logger.info('barcode detected', {
      format: raw.format,
      payloadKind: parsed.kind,
      rawValue: raw.rawValue,
      payload: JSON.stringify(parsed),
    });

    actions.recordDetection({ raw, parsed, videoSize });
  };

  const restart = () => {
    if (!videoEl) return;
    actions.markScanning();
    void videoEl.play().catch(() => {});
    scheduleScan();
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

      <Switch>
        <Match when={scanner.status === 'unsupported'}>
          <Flex as="div" class={css.callout} justify="center">
            <Container as="div" size={2}>
              <Callout color="warning" icon={<IconAlert />}>
                <Text as="span" weight="medium">
                  BarcodeDetector unavailable
                </Text>
                <Text as="span">
                  This browser does not expose the experimental BarcodeDetector
                  API. Try a recent Chromium-based browser on Android, ChromeOS,
                  or macOS.
                </Text>
              </Callout>
            </Container>
          </Flex>
        </Match>

        <Match when={scanner.status === 'error'}>
          <Flex as="div" class={css.callout} justify="center">
            <Container as="div" size={2}>
              <Callout color="danger" icon={<IconAlert />}>
                <Text as="span" weight="medium">
                  Scanner error
                </Text>
                <Text as="span" selectable>
                  {scanner.errorMessage}
                </Text>
              </Callout>
            </Container>
          </Flex>
        </Match>

        <Match
          when={
            scanner.status === 'requesting-camera' ||
            scanner.status === 'scanning' ||
            scanner.status === 'detected' ||
            scanner.status === 'probing'
          }
        >
          <Flex as="div" direction="column" class={css.stage}>
            <Flex as="div" class={css.frame}>
              <video
                ref={(el) => (videoEl = el)}
                class={css.video}
                muted
                playsinline
              />
              <Show when={scanner.detection} keyed>
                {(detection) => (
                  <svg
                    class={css.overlay}
                    viewBox={`0 0 ${detection.videoSize.width} ${detection.videoSize.height}`}
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                  >
                    <polygon
                      class={css.polygon}
                      points={buildPolygonPoints(detection.raw.cornerPoints)}
                    />
                  </svg>
                )}
              </Show>
            </Flex>

            <Show when={scanner.detection} keyed>
              {(detection) => (
                <Flex as="div" class={css.details} justify="center">
                  <Container as="div" size={2}>
                    <Flex as="div" direction="column" gap={4}>
                      <Card as="div" size={2}>
                        <Flex as="div" direction="column" gap={3}>
                          <Heading as="h2" size={4}>
                            Decoded payload
                          </Heading>
                          <ParsedPayloadView payload={detection.parsed} />
                        </Flex>
                      </Card>

                      <Card as="div" size={2}>
                        <Flex as="div" direction="column" gap={3}>
                          <Heading as="h2" size={4}>
                            Barcode metadata
                          </Heading>
                          <DataListRoot orientation="vertical" size={2}>
                            <DataListItem>
                              <DataListLabel>Format</DataListLabel>
                              <DataListValue>
                                {detection.raw.format}
                              </DataListValue>
                            </DataListItem>
                            <DataListItem>
                              <DataListLabel>Raw value</DataListLabel>
                              <DataListValue>
                                <Text as="span" selectable>
                                  {detection.raw.rawValue}
                                </Text>
                              </DataListValue>
                            </DataListItem>
                            <DataListItem>
                              <DataListLabel>Bounding box</DataListLabel>
                              <DataListValue>
                                {formatBoundingBox(detection.raw.boundingBox)}
                              </DataListValue>
                            </DataListItem>
                            <DataListItem>
                              <DataListLabel>Corner points</DataListLabel>
                              <DataListValue>
                                {detection.raw.cornerPoints
                                  .map(formatPoint)
                                  .join(' → ')}
                              </DataListValue>
                            </DataListItem>
                            <DataListItem>
                              <DataListLabel>Supported formats</DataListLabel>
                              <DataListValue>
                                {scanner.supportedFormats.join(', ')}
                              </DataListValue>
                            </DataListItem>
                          </DataListRoot>
                        </Flex>
                      </Card>

                      <Button
                        as="button"
                        size={3}
                        onClick={restart}
                        testId="scanner-restart"
                      >
                        <IconRestart />
                        Scan again
                      </Button>
                    </Flex>
                  </Container>
                </Flex>
              )}
            </Show>
          </Flex>
        </Match>
      </Switch>
    </Flex>
  );
};
