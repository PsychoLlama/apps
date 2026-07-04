import { Show } from 'solid-js';
import { FrameBody, SiteHeader } from '@lib/shell';
import { Container, Flex, Heading, TextField } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';
import { QrCode } from './qr-code';
import { connection, qrCode, shareLink } from '../state/session';
import * as styles from './beam-view.css';

/**
 * The sharer's view at `/beam`. Once the relay connection is live it surfaces
 * this endpoint's share link two ways side by side: a read-only field on the
 * left to copy and paste, and a QR code on the right for a peer to scan. The
 * connection lands the endpoint and its QR grid together, so both appear in the
 * same paint.
 */
export const Beam = () => {
  return (
    <>
      <SiteHeader title="Beam" actions={<ConnectionIndicator />} />
      <FrameBody>
        <Container as="div" size={2}>
          <Flex as="div" direction="column" gap={4}>
            <Heading as="h1" selectable={false}>
              Sharing link
            </Heading>

            <Show when={connection.endpoint}>
              {(endpoint) => (
                <Flex as="div" direction="row" gap={4} align="start">
                  <Show when={qrCode.grid}>
                    {(grid) => (
                      <QrCode
                        grid={grid().current}
                        label="QR code for the sharing link"
                      />
                    )}
                  </Show>

                  <TextField
                    testId="share-link"
                    readOnly
                    aria-label="Sharing link"
                    value={shareLink(endpoint().current.endpointId)}
                    class={styles.field}
                    name="endpoint-id"
                    autocomplete={undefined}
                    autocapitalize={undefined}
                    enterkeyhint={undefined}
                  />
                </Flex>
              )}
            </Show>
          </Flex>
        </Container>
      </FrameBody>
    </>
  );
};
