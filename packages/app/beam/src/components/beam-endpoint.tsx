import { createEffect, on } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useEffect } from '@lib/state';
import { FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Text } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';
import { connection, dialPeerEffect } from '../state/session';

/**
 * The peer's view at `/beam/with/:endpoint` — where a beam link lands,
 * dialling the endpoint named in the URL over the relay connection the layout
 * holds open. The dial only wires the connection up (and logs the outcome);
 * the receiving flow itself is still a work in progress.
 */
export const BeamEndpoint = () => {
  const params = useParams<{ endpoint: string }>();
  const dialPeer = useEffect(dialPeerEffect);

  // The dial needs the live endpoint, so hold off until the relay connection
  // lands. `on` re-runs if it cycles back to `connected` (e.g. a reconnect).
  createEffect(
    on(
      () => connection.status,
      (status) => {
        if (status === 'connected') void dialPeer(params.endpoint);
      },
    ),
  );

  return (
    <>
      <SiteHeader
        trail={[{ label: 'Beam', href: '/beam' }, { label: 'Connection' }]}
        actions={<ConnectionIndicator />}
      />
      <FrameBody>
        <Container as="div" size={2}>
          <Callout color="neutral">
            <Text as="span" size={2} selectable={false}>
              Work in progress.
            </Text>
          </Callout>
        </Container>
      </FrameBody>
    </>
  );
};
