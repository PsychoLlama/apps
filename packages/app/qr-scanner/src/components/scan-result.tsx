import { type Component, For, Show } from 'solid-js';
import type { ParsedDetail, ScanKind } from '@lib/qr-scanner';
import {
  Button,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
  Link,
} from '@lib/ui';
import IconRefresh from 'virtual:icons/mdi/refresh';

/** Friendly names for each recognized payload kind. */
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

/** Whether a parsed value is a web URL worth rendering as a hyperlink. */
const isWebLink = (value: string) => /^https?:\/\//i.test(value);

interface ScanResultProps {
  /** The raw payload decoded from the recognized code. */
  text: string;
  /** Which payload shape rxing recognized. */
  kind: ScanKind;
  /** Parsed payload as label/value rows; empty for opaque text. */
  details: readonly ParsedDetail[];
  /** Discards the result and reopens the camera. */
  onRetry: () => void;
}

/**
 * Recognized-code surface. Presents everything — the kind, the symbology,
 * and the parsed fields — as a single description list, with a control to
 * scan again. Opaque text (no parsed fields) shows the raw payload as its
 * lone content row.
 */
export const ScanResult: Component<ScanResultProps> = (props) => {
  const rows = (): ParsedDetail[] => [
    { label: 'Type', value: KIND_LABELS[props.kind] },
    ...(props.details.length > 0
      ? props.details
      : [{ label: 'Content', value: props.text }]),
  ];

  return (
    <Flex as="div" direction="column" align="center" gap={5}>
      <Heading as="h1" size={6} weight="medium" align="center">
        Code recognized
      </Heading>

      <DataListRoot orientation="vertical" size={2}>
        <For each={rows()}>
          {(detail) => (
            <DataListItem>
              <DataListLabel>{detail.label}</DataListLabel>
              <DataListValue>
                <Show when={isWebLink(detail.value)} fallback={detail.value}>
                  <Link
                    href={detail.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    testId="scan-link"
                  >
                    {detail.value}
                  </Link>
                </Show>
              </DataListValue>
            </DataListItem>
          )}
        </For>
      </DataListRoot>

      <Button testId="scan-again" size={3} onClick={() => props.onRetry()}>
        <IconRefresh width="20" height="20" aria-hidden="true" />
        Scan again
      </Button>
    </Flex>
  );
};
