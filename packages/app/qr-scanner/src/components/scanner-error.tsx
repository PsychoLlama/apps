import { Show, type Component } from 'solid-js';
import { Button, Flex, Heading, Text } from '@lib/ui';
import IconRefresh from 'virtual:icons/mdi/refresh';
import { type CameraErrorKind } from '../store';

/** User-facing copy for each failure mode. */
const ERROR_MESSAGES: Record<CameraErrorKind, string> = {
  'permission-denied':
    'Camera access was blocked. Allow the camera in your browser settings, then try again.',
  'no-camera': 'No camera found. Connect a camera and try again.',
  unsupported: "This browser can't reach the camera. Try another browser.",
  unknown: 'Something went wrong starting the camera. Try again.',
};

interface ScannerErrorProps {
  /** The failure mode that determines the displayed copy. */
  kind: CameraErrorKind;
  /** Retries the camera request. */
  onRetry: () => void;
}

/** Failure surface — swaps in for the landing pitch when a request fails. */
export const ScannerError: Component<ScannerErrorProps> = (props) => (
  <Flex as="div" direction="column" align="center" gap={5}>
    <Flex as="header" direction="column" align="center" gap={2}>
      <Heading
        as="h1"
        size={6}
        weight="medium"
        align="center"
        selectable={false}
      >
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
