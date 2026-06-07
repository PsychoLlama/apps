import { type Component } from 'solid-js';
import { Button, Callout, Flex, Heading, Text } from '@lib/ui';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconProgressWrench from 'virtual:icons/mdi/progress-wrench';

interface LandingProps {
  /** Whether a camera request is in flight — disables the start control. */
  requesting: boolean;
  /** Opens the camera feed. */
  onStart: () => void;
}

/** Landing pitch + the primary action that opens the camera. */
export const Landing: Component<LandingProps> = (props) => (
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
      Work in progress.
    </Callout>
  </Flex>
);
