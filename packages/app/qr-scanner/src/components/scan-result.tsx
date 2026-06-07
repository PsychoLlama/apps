import { type Component, For, Show } from 'solid-js';
import type { ParsedDetail, ScanKind } from '@lib/qr-scanner';
import {
  Badge,
  Button,
  Code,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
} from '@lib/ui';
import IconRefresh from 'virtual:icons/mdi/refresh';

/** Friendly names for each recognized payload kind, shown as a badge. */
const KIND_LABELS: Record<ScanKind, string> = {
  wifi: 'Wi-Fi',
  url: 'Link',
  email: 'Email',
  sms: 'SMS',
  geo: 'Location',
  tel: 'Phone',
  calendar: 'Event',
  contact: 'Contact',
  isbn: 'ISBN',
  vin: 'VIN',
  product: 'Product',
  text: 'Text',
};

interface ScanResultProps {
  /** The raw payload decoded from the recognized code. */
  text: string;
  /** Which payload shape rxing recognized — labels the result. */
  kind: ScanKind;
  /** Parsed payload as label/value rows; empty for opaque text. */
  details: readonly ParsedDetail[];
  /** Discards the result and reopens the camera. */
  onRetry: () => void;
}

/**
 * Recognized-code surface. Shows the parsed payload as a description list
 * (when rxing classified it) above the raw text, with a control to scan
 * again.
 */
export const ScanResult: Component<ScanResultProps> = (props) => (
  <Flex as="div" direction="column" align="center" gap={5}>
    <Flex as="header" direction="column" align="center" gap={2}>
      <Heading as="h1" size={6} weight="medium" align="center">
        Code recognized
      </Heading>
      <Badge>{KIND_LABELS[props.kind]}</Badge>
    </Flex>

    <Show when={props.details.length > 0}>
      <DataListRoot orientation="vertical" size={2}>
        <For each={props.details}>
          {(detail) => (
            <DataListItem>
              <DataListLabel>{detail.label}</DataListLabel>
              <DataListValue>{detail.value}</DataListValue>
            </DataListItem>
          )}
        </For>
      </DataListRoot>
    </Show>

    <Code size={2} wrap="wrap">
      {props.text}
    </Code>

    <Button testId="scan-again" size={3} onClick={() => props.onRetry()}>
      <IconRefresh width="20" height="20" aria-hidden="true" />
      Scan again
    </Button>
  </Flex>
);
