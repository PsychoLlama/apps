import { type Component } from 'solid-js';
import { Button, Code, Flex, Heading } from '@lib/ui';
import IconRefresh from 'virtual:icons/mdi/refresh';

interface ScanResultProps {
  /** The raw payload decoded from the recognized code. */
  text: string;
  /** Discards the result and reopens the camera. */
  onRetry: () => void;
}

/** Recognized-code surface — shows the raw payload with a control to scan again. */
export const ScanResult: Component<ScanResultProps> = (props) => (
  <Flex as="div" direction="column" align="center" gap={5}>
    <Flex as="header" direction="column" align="center" gap={2}>
      <Heading as="h1" size={6} weight="medium" align="center">
        Code recognized
      </Heading>
    </Flex>

    <Code size={2} wrap="wrap">
      {props.text}
    </Code>

    <Button testId="scan-again" size={3} onClick={() => props.onRetry()}>
      <IconRefresh width="20" height="20" aria-hidden="true" />
      Scan again
    </Button>
  </Flex>
);
