import { createEffect, on, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useRun, useValue } from '@lib/state';
import { FrameBody, SiteHeader } from '@lib/shell';
import { Button, Callout, Container, Flex, Heading, Link, Text } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';
import { addressBookFormula } from '../state/contacts';
import { generateLabel } from '../state/labels';
import {
  cancelPairingSaga,
  connectionStore,
  dialPeerSaga,
  relayCell,
  reportSagaFailure,
  shareStatesFormula,
  type ShareState,
} from '../state/session';

/** What each state of the pairing says, phrased from this device's side. */
const describeState = (state: ShareState): string => {
  switch (state) {
    case 'preparing':
      return 'Getting ready to connect…';
    case 'connecting':
      return 'Connecting…';
    case 'awaiting':
      return 'Waiting for them to accept. Keep this device awake.';
    case 'connected':
      return 'Paired. Ready to share.';
    case 'unreachable':
      return 'Couldn’t reach this device. It may be offline.';
  }
};

/**
 * The share view at `/beam/share/:id` — where a beam link lands. It dials the
 * endpoint named in the URL over the relay connection the layout holds open,
 * introduces this device, and reports how the pairing stands until the peer
 * answers. Sharing itself is still a work in progress.
 *
 * Opening your own link is its own case, not an error: it's what happens
 * when you scan the code off your own screen, and the page says so rather
 * than sitting on a dial that will never land.
 */
export const BeamShare = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const connection = useValue(connectionStore);
  const endpoint = useValue(relayCell);
  const contacts = useValue(addressBookFormula);
  const states = useValue(shareStatesFormula);

  const dial = useRun(dialPeerSaga);
  const cancel = useRun(cancelPairingSaga);

  /** Whether this link points back at the device reading it. */
  const isSelf = () => endpoint()?.endpointId === params.id;

  /** This peer's record, once the address book has one for it. */
  const contact = () =>
    contacts().find((view) => view.endpointId === params.id);

  /**
   * What to call the peer. The address book has a name for it the moment the
   * dial records it; before that — and for the first paint of a cold load —
   * its key prefix is the same name both devices would land on anyway.
   */
  const name = () => contact()?.name ?? generateLabel(params.id);

  /** Where the pairing stands. Nothing attempted yet reads as `preparing`. */
  const state = (): ShareState => states()[params.id] ?? 'preparing';

  // The dial needs the live endpoint, so hold off until the relay connection
  // lands. `on` re-runs if it cycles back to `connected` (e.g. a reconnect);
  // the saga itself ignores a peer already dialled.
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

  const handleCancel = () => {
    void cancel(params.id)
      .then(() => navigate('/beam'))
      .catch(reportSagaFailure('The pairing cancel saga failed.'));
  };

  return (
    <>
      {/* No `:id` in the trail. This route is served from one prerendered
          shell for every id, so a param-derived `href` ships the `__id`
          build sentinel in the markup — live to any tap that lands before
          hydration replaces it. Same rule as the contact page. */}
      <SiteHeader
        trail={[{ label: 'Beam', href: '/beam' }, { label: 'Share' }]}
        actions={<ConnectionIndicator />}
      />
      <FrameBody>
        <Container as="div" size={2}>
          <Show
            when={!isSelf()}
            fallback={
              <Callout color="neutral">
                <Text as="span" size={2} selectable={false}>
                  This is this device’s own beam link. Open it somewhere else to
                  pair.
                </Text>
              </Callout>
            }
          >
            <Flex as="div" direction="column" gap={5}>
              <Flex as="hgroup" direction="column" gap={2}>
                {/* The name is the way to the peer's record — a title that
                    happens to be a link, rather than a second line of copy
                    pointing at one.

                    Only once the contact exists, which is also what keeps
                    the `href` honest: this route is served from one
                    prerendered shell for every id, so an anchor in that
                    markup would ship the `__id` build sentinel and hand it
                    to anyone who tapped before hydration caught up. The
                    address book is empty during prerender, so this element
                    is only ever built on the client, from the record rather
                    than the route. */}
                <Heading as="h1" selectable={false}>
                  <Show when={contact()} fallback={name()}>
                    {(view) => (
                      <Link
                        testId="beam-share-contact"
                        href={`/beam/contacts/${view().endpointId}`}
                        color="neutral"
                        underline="hover"
                      >
                        {view().name}
                      </Link>
                    )}
                  </Show>
                </Heading>

                <Text as="p" size={2} color="lowContrast" selectable={false}>
                  {describeState(state())}
                </Text>
              </Flex>

              <Callout color="neutral">
                <Text as="span" size={2} selectable={false}>
                  Sharing is a work in progress.
                </Text>
              </Callout>

              {/* Withdrawing only makes sense while they haven't answered.
                  Once paired, the way out is Remove on the contact's page —
                  the same door for a pairing that was never accepted and one
                  that's simply no longer wanted. */}
              <Show when={state() === 'awaiting' || state() === 'connecting'}>
                <Flex as="div" direction="row" gap={3} align="center">
                  <Button
                    testId="beam-share-cancel"
                    variant="soft"
                    color="neutral"
                    onClick={handleCancel}
                  >
                    Cancel invite
                  </Button>
                </Flex>
              </Show>
            </Flex>
          </Show>
        </Container>
      </FrameBody>
    </>
  );
};
