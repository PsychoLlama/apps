import { createEffect, on, onCleanup, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useCommit, useRun, useValue } from '@lib/state';
import { FrameBody } from '@lib/shell';
import { AlertDialog, Button, Callout, Flex, Heading, Text } from '@lib/ui';
import { RenameDialog } from './rename-dialog';
import { ShareComposer } from './share-composer';
import { ShareLog } from './share-log';
import { addressBookFormula, forgetContactSaga } from '../state/contacts';
import { isEndpointId } from '../state/endpoint';
import { reportSagaFailure } from '../state/failure';
import { identityStore } from '../state/identity';
import { generateLabel } from '../state/labels';
import {
  connectionStore,
  dialPeerSaga,
  disconnectPeerSaga,
  peerStatesFormula,
  type PeerState,
} from '../state/network';
import { sharesByPeerFormula } from '../state/shares';
import {
  peerBlurredTopic,
  peerFocusedTopic,
  removalClosedTopic,
  removalOpenedTopic,
  removalStore,
  renameOpenedTopic,
} from '../state/view';
import * as styles from './beam-share.css';

/** Dates read as dates, not timestamps. Follows the reader's locale. */
const formatMoment = (epochMilliseconds: number): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(epochMilliseconds);

/**
 * The peer view at `/beam/share/:id` — where a beam link lands, and the only
 * page there is about another device. It dials the endpoint named in the URL
 * over the endpoint connection the layout holds open, introduces this device,
 * and carries the composer and the session's log of what has passed between
 * the two. How the connection stands is reported by the frame's status bar,
 * which this view points at the peer for as long as it's open. Files are
 * Phase 5.
 *
 * The record used to be a page of its own a hop further on, and most of it
 * turned out not to be worth keeping. The endpoint key is in the address bar
 * already; what's left is when the peer was met, which reads as a caption on
 * its name, and the two things you'd do to it, which sit with the name they
 * act on.
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
  const states = useValue(peerStatesFormula);
  const shares = useValue(sharesByPeerFormula);
  const removal = useValue(removalStore);

  const dial = useRun(dialPeerSaga);
  const disconnect = useRun(disconnectPeerSaga);
  const forget = useRun(forgetContactSaga);
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
  const state = (): PeerState => states()[params.id] ?? 'preparing';

  // Forgetting a peer leaves this page behind: it's the record's page as much
  // as the connection's, and staying on it would show a device that is no
  // longer in the book, its name already reverted to a key prefix.
  const handleForget = () => {
    void forget(params.id)
      .then(() => navigate('/beam'))
      .catch(reportSagaFailure('The contact forget saga failed.'));
  };

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
  // open. The bar is mounted by the layout, which can't tell which route is
  // showing from its own params, so the view that knows says so.
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
    // The frame is prerendered; nothing inside it is. This route is served
    // from one shell for every id, built against the `__id` sentinel, so
    // anything derived from `:id` at build time is derived from a placeholder
    // — a param-built `href` ships live and wrong, and a param-built branch
    // renders a tree the client then disagrees with, which is a hydration
    // crash rather than a cosmetic slip. Holding the body back until
    // `identified()` retires the whole class of bug instead of the instances
    // of it.
    //
    // Nothing caps the column either. The pane is already as narrow as the
    // contacts rail leaves it, and a second cap inside that would float the
    // page in its own frame — where the log has bodies to fit and the
    // composer is something to type into, both of which would rather have
    // the room.
    <FrameBody>
      <Show when={identified()}>
        {/* Nothing was dialled and nothing was written to the address book,
            which is the point of answering this here: the book is written
            before the dial, so an id that could never be one has to be turned
            away before it becomes a contact nobody can remove without going
            looking for it. */}
        <Show
          when={dialable()}
          fallback={
            <Callout color="warning">
              <Text as="span" size={2} selectable={false}>
                That isn’t a beam link. Check the address, or scan the code from
                the other device.
              </Text>
            </Callout>
          }
        >
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
              {/* Both controls act on the name beside them, which is why
                  they sit with it: one edits it, the other takes it away.
                  Labelled rather than iconic — "rename" and "forget" have no
                  glyph a reader would land on without being told, and
                  forgetting is the one thing here that can't be undone.

                  Only rendered once the contact exists — there's nothing to
                  rename or forget until the peer is one. */}
              <Flex
                as="div"
                direction="row"
                align="start"
                justify="between"
                gap={3}
              >
                {/* The date rides under the name as the heading's own
                    subtitle. It's the one thing worth saying about a peer
                    beyond what it's called — whether this is somebody you
                    met months ago or the device in your hand right now —
                    and it reads as a caption on the name rather than as a
                    field to look up. */}
                <Flex as="hgroup" direction="column" gap={1}>
                  <Heading as="h1" class={styles.name} selectable={false}>
                    {name()}
                  </Heading>

                  <Show when={contact()}>
                    {(view) => (
                      <Text
                        as="p"
                        size={1}
                        color="lowContrast"
                        selectable={false}
                      >
                        Added {formatMoment(view().createdAt)}
                      </Text>
                    )}
                  </Show>
                </Flex>

                <Show when={contact()}>
                  {(view) => (
                    <Flex
                      as="div"
                      direction="row"
                      align="center"
                      gap={2}
                      class={styles.actions}
                    >
                      <Button
                        testId="beam-share-rename"
                        variant="soft"
                        color="neutral"
                        onClick={() =>
                          commit(
                            renameOpenedTopic({
                              kind: 'peer',
                              endpointId: view().endpointId,
                            }),
                          )
                        }
                      >
                        Rename
                      </Button>

                      <Button
                        testId="beam-share-forget"
                        variant="soft"
                        color="danger"
                        onClick={() =>
                          commit(removalOpenedTopic(view().endpointId))
                        }
                      >
                        Forget
                      </Button>
                    </Flex>
                  )}
                </Show>
              </Flex>

              {/* Everything below hangs off the record rather than the route
                  param: there's nobody to write to until the peer is a
                  contact. */}
              <Show when={contact()}>
                {(view) => (
                  <>
                    {/* The composer leads and what was shared follows it.
                        Sharing is the reason the page was opened — the field
                        is what you came to use, so it sits where the eye
                        lands rather than under a log you have to scroll past
                        to reach it. What's been shared reads as the result
                        of it, newest first, directly beneath. */}
                    <ShareComposer
                      endpointId={view().endpointId}
                      connected={state() === 'connected'}
                    />

                    <ShareLog
                      shares={shares()[view().endpointId] ?? []}
                      peerName={view().name}
                    />

                    <RenameDialog
                      target={{ kind: 'peer', endpointId: view().endpointId }}
                    />

                    {/* The name is in the question because the page it was
                        asked from is about to be left behind — the
                        confirmation is the last thing on screen that still
                        says who this was. */}
                    <AlertDialog
                      testId="beam-share-forget-dialog"
                      open={removal().endpointId === view().endpointId}
                      onOpenChange={() => commit(removalClosedTopic())}
                      title="Forget this contact?"
                      description={`${view().name} drops out of your address book. They can still reach this device if they have its link.`}
                      actionText="Forget"
                      color="danger"
                      onAction={handleForget}
                    />
                  </>
                )}
              </Show>
            </Flex>
          </Show>
        </Show>
      </Show>
    </FrameBody>
  );
};
