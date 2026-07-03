import { Show, createEffect, on } from 'solid-js';
import { useEffect } from '@lib/state';
import { FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Flex, Heading, Text, TextField } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';
import { QrCode } from './qr-code';
import { connection } from '../state/connection';
import { encodeQrCodeEffect, qrCode } from '../state/qr-code';

/**
 * A shareable link to this endpoint — the `/share/with/:endpoint` URL a peer
 * opens to dial us, keyed by the endpoint's public identity. Only ever built
 * client-side (the endpoint is `null` until the client-only connect lands), so
 * `window.location.origin` is safe to read.
 */
const shareLink = (endpointId: string): string =>
  new URL(`/share/with/${endpointId}`, window.location.origin).href;

/**
 * The sharer's view at `/share`. Still a stub — the sharing flow itself is a
 * work in progress — but once the relay connection is live it surfaces this
 * endpoint's share link both as a read-only field to copy and as a QR code a
 * peer can scan to open it.
 */
export const Share = () => {
  const encodeQrCode = useEffect(encodeQrCodeEffect);

  // The share link only exists client-side once the endpoint lands, and the
  // wasm encoder is client-only too — so encode reactively as the connection
  // comes up (and again if it cycles back after a reconnect).
  createEffect(
    on(
      () => connection.endpoint,
      (endpoint) => {
        if (endpoint) void encodeQrCode(shareLink(endpoint.current.endpointId));
      },
    ),
  );

  return (
    <>
      <SiteHeader title="Share" actions={<ConnectionIndicator />} />
      <FrameBody>
        <Container as="div" size={2}>
          <Flex as="div" direction="column" gap={4}>
            <Heading as="h1" selectable={false}>
              Sharing link
            </Heading>

            <Show when={connection.endpoint}>
              {(endpoint) => (
                <TextField
                  testId="share-link"
                  readOnly
                  aria-label="Sharing link"
                  value={shareLink(endpoint().current.endpointId)}
                  autocomplete={undefined}
                  autocapitalize={undefined}
                  enterkeyhint={undefined}
                />
              )}
            </Show>

            <Show when={connection.endpoint && qrCode.grid}>
              {(grid) => (
                <QrCode
                  grid={grid().current}
                  label="QR code for the sharing link"
                />
              )}
            </Show>

            <Callout color="neutral">
              <Text as="span" size={2} selectable={false}>
                Work in progress.
              </Text>
            </Callout>
          </Flex>
        </Container>
      </FrameBody>
    </>
  );
};
