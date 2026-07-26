import { Show } from 'solid-js';
import { useValue } from '@lib/state-next';
import { FrameBody, SiteHeader } from '@lib/shell';
import { Container, Flex, Heading, TextField } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';
import { QrCode } from './qr-code';
import { beamLink, qrCode, relay } from '../state/session';
import * as styles from './beam-invite.css';

/**
 * The invite view at `/beam/invite`. Once the relay connection is live it
 * surfaces this endpoint's beam link two ways side by side: a read-only field
 * on the left to copy and paste, and a QR code on the right for a peer to scan.
 * The connection lands the endpoint and its QR grid in one transition, so both
 * appear in the same paint.
 */
export const BeamInvite = () => {
  const endpoint = useValue(relay);
  const grid = useValue(qrCode);

  return (
    <>
      <SiteHeader
        trail={[{ label: 'Beam', href: '/beam' }, { label: 'Invite' }]}
        actions={<ConnectionIndicator />}
      />
      <FrameBody>
        <Container as="div" size={2}>
          <Flex as="div" direction="column" gap={4}>
            <Heading as="h1" selectable={false}>
              Beam link
            </Heading>

            <Show when={endpoint()}>
              {(live) => (
                <Flex as="div" direction="row" gap={4} align="start">
                  <Show when={grid()}>
                    {(code) => (
                      <QrCode grid={code()} label="QR code for the beam link" />
                    )}
                  </Show>

                  <TextField
                    testId="beam-link"
                    readOnly
                    aria-label="Beam link"
                    value={beamLink(live().endpointId)}
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
