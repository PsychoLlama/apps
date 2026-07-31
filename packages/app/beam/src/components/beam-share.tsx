import { createEffect, on, onCleanup, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useCommit, useRun, useValue } from '@lib/state';
import { FrameBody } from '@lib/shell';
import { Callout, Container, Flex, Heading, LinkButton, Text } from '@lib/ui';
import IconContactCard from 'virtual:icons/mdi/card-account-details-outline';
import { ShareComposer } from './share-composer';
import { ShareLog } from './share-log';
import { addressBookFormula } from '../state/contacts';
import { isEndpointId } from '../state/endpoint-id';
import { generateLabel } from '../state/labels';
import {
  connectionStore,
  dialPeerSaga,
  disconnectPeerSaga,
  identityStore,
  peerBlurredTopic,
  peerFocusedTopic,
  reportSagaFailure,
  shareStatesFormula,
  sharesByPeerFormula,
  type ShareState,
} from '../state/session';

/**
 * The share view at `/beam/share/:id` — where a beam link lands, and where
 * sharing happens. It dials the endpoint named in the URL over the endpoint
 * connection the layout holds open, introduces this device, and carries the
 * composer and the session's log of what has passed between the two. How the
 * pairing stands is reported by the frame's status bar, which this view
 * points at the peer for as long as it's open. Files are Phase 5.
 *
 * Opening your own link is its own case, not an error: it's what happens
 * when you scan the code off your own screen, and the page says so rather
 * than sitting on a dial that will never land.
 */
export const BeamShare = () => {
  const params = useParams<{ id: string }>();

  const connection = useValue(connectionStore);
  const self = useValue(identityStore);
  const contacts = useValue(addressBookFormula);
  const states = useValue(shareStatesFormula);
  const shares = useValue(sharesByPeerFormula);

  const dial = useRun(dialPeerSaga);
  const disconnect = useRun(disconnectPeerSaga);
  const commit = useCommit();

  /**
   * Whether the route names an address at all. Format only — it says the id
   * could be dialled, never that anything is listening — and it's synchronous,
   * so a link that was never one is answered the moment this device can speak
   * rather than after a handshake it can't survive.
   */
  const dialable = () => isEndpointId(params.id);

  /**
   * Whether this device has answered for itself yet, either way: the endpoint
   * key landed, or the wasm load failed and never will.
   *
   * This is the gate on everything below, and the reason is the prerender.
   * `/beam/share/:id` is served from one shell built against the `__id`
   * sentinel, so the shell's `:id` is a placeholder — every conclusion drawn
   * from it is drawn about the wrong string. Rather than audit each one, the
   * body simply doesn't exist until the client is answering: the frame is
   * prerendered, the contents are not. Hydration adopts an empty container on
   * both sides, which is the only version of this that can't drift.
   *
   * The failure arm matters as much as the identity one. Without it a wasm
   * load that errors leaves the page blank permanently, which reads as a
   * broken link rather than a broken device.
   */
  const identified = () =>
    self().endpointId !== null || connection().status === 'failed';

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
        if (!dialable()) return;
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

  // Point the frame's status bar at this peer for as long as the view is
  // open. The bar is mounted by the layout, which can't tell a share route
  // from a contact route by its params, so the view that knows says so.
  //
  // Keyed so that opening your own link focuses nothing: nothing is dialled
  // there, and a reading stuck on "Connecting" for a connection that was
  // never attempted is worse than an empty corner. Identity settles after
  // first paint, so this re-runs and clears itself once it does. A link that
  // was never an address is the same case for the same reason.
  createEffect(
    on(
      () => (isSelf() || !dialable() ? null : params.id),
      (endpointId) => {
        if (!endpointId) return;

        commit(peerFocusedTopic(endpointId));
        onCleanup(() => commit(peerBlurredTopic(endpointId)));
      },
    ),
  );

  return (
    <>
      {/* The frame is prerendered; nothing inside it is. This route is served
          from one shell for every id, built against the `__id` sentinel, so
          anything derived from `:id` at build time is derived from a
          placeholder — a param-built `href` ships live and wrong, and a
          param-built branch renders a tree the client then disagrees with,
          which is a hydration crash rather than a cosmetic slip. Holding the
          body back until `identified()` retires the whole class of bug
          instead of the instances of it. Same rule as the contact page, which
          waits on its address book read for the same reason. */}
      <FrameBody>
        <Container as="div" size={2}>
          <Show when={identified()}>
            {/* Nothing was dialled and nothing was written to the address
                book, which is the point of answering this here: the book is
                written before the dial, so an id that could never be one has
                to be turned away before it becomes a contact nobody can
                remove without going looking for it. */}
            <Show
              when={dialable()}
              fallback={
                <Callout color="warning">
                  <Text as="span" size={2} selectable={false}>
                    That isn’t a beam link. Check the address, or scan the code
                    from the other device.
                  </Text>
                </Callout>
              }
            >
              <Show
                when={!isSelf()}
                fallback={
                  <Callout color="neutral">
                    <Text as="span" size={2} selectable={false}>
                      This is this device’s own beam link. Open it somewhere
                      else to pair.
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

                  Only rendered once the contact exists, which is the right
                  gate on its own terms: there's no record to point at until
                  the peer is one. */}
                  <Flex
                    as="div"
                    direction="row"
                    align="center"
                    justify="between"
                    gap={3}
                  >
                    <Heading as="h1" selectable={false}>
                      {name()}
                    </Heading>

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

                  {/* Both hang off the record rather than the route param:
                  there's nobody to write to until the peer is a contact. */}
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
            </Show>
          </Show>
        </Container>
      </FrameBody>
    </>
  );
};
