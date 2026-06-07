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

/** A parsed value resolved to an anchor target. */
interface DetailLink {
  /** The `href` to navigate to. */
  href: string;
  /** Web links open in a new tab; `mailto:`/`tel:` invoke a handler. */
  external: boolean;
}

const isWebLink = (value: string) => /^https?:\/\//i.test(value);

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Heuristic phone test. Deliberately conservative: rejects values that
 * carry letters (VINs, "100 m" altitudes), decimals (geo coordinates),
 * or an ISO date (all-day calendar events) — each of which is otherwise
 * digit-heavy enough to look dial-able. What's left is 7–15 digits.
 */
const isPhone = (value: string) => {
  if (/[a-z]/i.test(value)) return false;
  if (value.includes('.')) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

/**
 * Resolve a parsed value to a hyperlink, or `undefined` to render it as
 * plain text. Value-based by design (a heuristic, not keyed to the parsed
 * field), so a URL/email/phone is linked wherever it appears.
 */
const linkFor = (value: string): DetailLink | undefined => {
  const trimmed = value.trim();
  if (isWebLink(trimmed)) return { href: trimmed, external: true };
  if (isEmail(trimmed)) return { href: `mailto:${trimmed}`, external: false };
  if (isPhone(trimmed))
    return {
      href: `tel:${trimmed.replace(/[^\d+]/g, '')}`,
      external: false,
    };
  return undefined;
};

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
    <Flex as="div" direction="column" gap={5}>
      <Heading as="h1" size={6} weight="medium">
        Code recognized
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
                      href={link().href}
                      target={link().external ? '_blank' : undefined}
                      rel={link().external ? 'noopener noreferrer' : undefined}
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
