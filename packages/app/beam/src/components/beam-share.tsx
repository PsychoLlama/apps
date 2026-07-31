import { createEffect, on, onCleanup, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useRun, useValue } from '@lib/state';
import { FrameBody, SiteHeader } from '@lib/shell';
import {
  Button,
  Callout,
  Container,
  Flex,
  Heading,
  LinkButton,
  Text,
} from '@lib/ui';
import IconContactCard from 'virtual:icons/mdi/card-account-details-outline';
import { ConnectionIndicator } from './connection-indicator';
import { ShareComposer } from './share-composer';
import { ShareLog } from './share-log';
import { addressBookFormula } from '../state/contacts';
import { generateLabel } from '../state/labels';
import {
  cancelPairingSaga,
  connectionStore,
  dialPeerSaga,
  disconnectPeerSaga,
  identityStore,
  reportSagaFailure,
  shareStatesFormula,
  sharesByPeerFormula,
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
    case 'disconnected':
      return 'Disconnected. Anything you write will reach them when they’re back.';
  }
};

/**
 * The share view at `/beam/share/:id` — where a beam link lands, and where
 * sharing happens. It dials the endpoint named in the URL over the endpoint
 * connection the layout holds open, introduces this device, reports how the
 * pairing stands until the peer answers, and carries the composer and the
 * session's log of what has passed between the two. Files are Phase 5.
 *
 * Opening your own link is its own case, not an error: it's what happens
 * when you scan the code off your own screen, and the page says so rather
 * than sitting on a dial that will never land.
 */
export const BeamShare = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const connection = useValue(connectionStore);
  const self = useValue(identityStore);
  const contacts = useValue(addressBookFormula);
  const states = useValue(shareStatesFormula);
  const shares = useValue(sharesByPeerFormula);

  const dial = useRun(dialPeerSaga);
  const cancel = useRun(cancelPairingSaga);
  const disconnect = useRun(disconnectPeerSaga);

  /**
   * Whether this link points back at the device reading it. Answered off the
   * identity rather than the endpoint, so scanning your own code says so
   * straight away instead of after the handshake.
   */
  const isSelf = () => self().endpointId === params.id;

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
  // lands. Keyed on the peer too, since one share view serves every id: a
  // relay that cycles back to `connected`, or a different peer, both mean
  // dial. The saga itself ignores a peer already dialled or in flight.
  createEffect(
    on(
      () => [params.id, connection().status] as const,
      ([endpointId, status]) => {
        if (status !== 'connected') return;
        void dial(endpointId).catch(
          reportSagaFailure('The beam dial saga failed.'),
        );
      },
    ),
  );

  // Leaving takes the connection with it. This view is the only place a live
  // link means anything, and holding one open past it keeps a relay stream
  // busy on both devices and leaves this one listed as reachable on a screen
  // nobody is looking at. The pairing and anything queued survive; coming
  // back dials again and sends what's waiting.
  //
  // Keyed on the id rather than hung off the component, so moving between two
  // peers' views hangs up on the one being left rather than on whichever id
  // the route params happen to hold by the time cleanup runs.
  createEffect(
    on(
      () => params.id,
      (endpointId) => {
        onCleanup(() => {
          void disconnect(endpointId).catch(
            reportSagaFailure('The peer disconnect saga failed.'),
          );
        });
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
              {/* The record sits behind a labelled link rather than the
                  title itself: a heading that quietly navigates gives no
                  hint of where, and "somewhere about this device" is the
                  part a reader can't guess. Ghost keeps it quiet beside the
                  name without pretending not to be a control.

                  Only rendered once the contact exists. That's what keeps
                  the `href` honest: this route is served from one
                  prerendered shell for every id, so an anchor built from
                  the route param at build time carries the `__id` sentinel.
                  The address book is empty during prerender, so this is
                  only ever built on the client, from the record. */}
              <Flex
                as="div"
                direction="row"
                align="start"
                justify="between"
                gap={3}
              >
                <Flex as="hgroup" direction="column" gap={2}>
                  <Heading as="h1" selectable={false}>
                    {name()}
                  </Heading>

                  <Text as="p" size={2} color="lowContrast" selectable={false}>
                    {describeState(state())}
                  </Text>
                </Flex>

                <Show when={contact()}>
                  {(view) => (
                    <LinkButton
                      testId="beam-share-contact"
                      href={`/beam/contacts/${view().endpointId}`}
                      variant="ghost"
                      color="neutral"
                    >
                      <IconContactCard
                        width="18"
                        height="18"
                        aria-hidden="true"
                      />
                      Details
                    </LinkButton>
                  )}
                </Show>
              </Flex>

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

              {/* Both hang off the record rather than the route param. The
                  address book is empty during prerender, so this is the same
                  rule that keeps the details link honest — and it's also the
                  right gate on its own terms: there's nobody to write to
                  until the peer is a contact. */}
              <Show when={contact()}>
                {(view) => (
                  <>
                    <ShareLog
                      shares={shares()[view().endpointId] ?? []}
                      peerName={view().name}
                    />

                    <ShareComposer
                      endpointId={view().endpointId}
                      connected={state() === 'connected'}
                    />
                  </>
                )}
              </Show>
            </Flex>
          </Show>
        </Container>
      </FrameBody>
    </>
  );
};
