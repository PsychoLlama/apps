import { createEffect, on } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useRun, useValue } from '@lib/state-next';
import { FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Text } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';
import {
  connectionStore,
  dialPeerSaga,
  reportSagaFailure,
} from '../state/session';

/**
 * The share view at `/beam/share/:id` — where a beam link lands, dialling the
 * endpoint named in the URL over the relay connection the layout holds open.
 * The dial only wires the connection up (and logs the outcome); the sharing
 * flow itself is still a work in progress.
 */
export const BeamShare = () => {
  const params = useParams<{ id: string }>();
  const connection = useValue(connectionStore);
  const dial = useRun(dialPeerSaga);

  // The dial needs the live endpoint, so hold off until the relay connection
  // lands. `on` re-runs if it cycles back to `connected` (e.g. a reconnect).
  createEffect(
    on(
      () => connection().status,
      (status) => {
        if (status !== 'connected') return;
        void dial(params.id).catch(
          reportSagaFailure('The beam dial saga failed.'),
        );
      },
    ),
  );

  return (
    <>
      <SiteHeader
        trail={[{ label: 'Beam', href: '/beam' }, { label: 'Share' }]}
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
