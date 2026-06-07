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
import { linkFor } from '../scan-link';

/** Friendly names for each recognized payload kind, used as the heading. */
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
  /** Which payload shape rxing recognized — titles the result. */
  kind: ScanKind;
  /** Parsed payload as label/value rows; empty for opaque text. */
  details: readonly ParsedDetail[];
  /** Discards the result and reopens the camera. */
  onRetry: () => void;
}

/**
 * Recognized-code surface. The kind titles the screen; the parsed fields
 * follow as a description list, with each URL/email/phone value linked.
 * Opaque text (no parsed fields) shows the raw payload as its lone row.
 */
export const ScanResult: Component<ScanResultProps> = (props) => {
  const rows = (): ParsedDetail[] =>
    props.details.length > 0
      ? [...props.details]
      : [{ label: 'Content', value: props.text }];

  return (
    <Flex as="div" direction="column" gap={5}>
      <Heading as="h1" size={6} weight="medium" selectable={false}>
        {KIND_LABELS[props.kind]}
      </Heading>

      <DataListRoot orientation="vertical" size={2}>
        <For each={rows()}>
          {(detail) => (
            <DataListItem>
              <DataListLabel>{detail.label}</DataListLabel>
              <DataListValue>
                <Show when={linkFor(detail.value)} fallback={detail.value}>
                  {(link) => (
                    <Link
                      external
                      href={link().href}
                      target={link().newTab ? '_blank' : undefined}
                      rel={link().newTab ? 'noopener noreferrer' : undefined}
                      testId="scan-link"
                    >
                      {detail.value}
                    </Link>
                  )}
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
