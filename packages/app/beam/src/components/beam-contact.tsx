import { Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useCommit, useRun, useValue } from '@lib/state';
import { FrameBody, SiteHeader } from '@lib/shell';
import {
  AlertDialog,
  Badge,
  Button,
  Callout,
  Container,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
  IconButton,
  Text,
} from '@lib/ui';
import IconPencil from 'virtual:icons/mdi/pencil-outline';
import {
  addressBookFormula,
  contactsStore,
  forgetContactSaga,
  removalClosedTopic,
  removalOpenedTopic,
  removalStore,
  renameOpenedTopic,
  type ContactView,
} from '../state/contacts';
import { reportSagaFailure } from '../state/session';
import { ConnectionIndicator } from './connection-indicator';
import { PairingRequest } from './pairing-request';
import { RenameDialog } from './rename-dialog';
import * as styles from './beam-contact.css';

/** Dates read as dates, not timestamps. Follows the reader's locale. */
const formatMoment = (epochMilliseconds: number): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(epochMilliseconds);

/** How this contact's pairing stands, phrased from this device's side. */
const describeTrust = (contact: ContactView): string => {
  if (contact.trust === 'trusted') return 'Paired. Ready to share.';

  return contact.direction === 'outbound'
    ? 'Waiting for them to accept the invite.'
    : 'They asked to pair. Waiting on you.';
};

/**
 * The contact detail view at `/beam/contacts/:id` — one peer's record: what
 * it's called, how the pairing began, and the controls to rename or forget it.
 *
 * Everything below the header renders from the address book, which is read
 * from IndexedDB on the client. That's what keeps this page's prerendered
 * shell free of anything derived from `:id`.
 */
export const BeamContact = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const book = useValue(contactsStore);
  const contacts = useValue(addressBookFormula);
  const removal = useValue(removalStore);
  const commit = useCommit();

  const forget = useRun(forgetContactSaga);

  /** The resolved view — the name and dates the page renders. */
  const contact = () =>
    contacts().find((view) => view.endpointId === params.id);

  /** Whether the read has landed, either way. Until then the page waits. */
  const settled = () => book().status === 'ready' || book().status === 'failed';

  const handleForget = () => {
    void forget(params.id)
      .then(() => navigate('/beam'))
      .catch(reportSagaFailure('The contact forget saga failed.'));
  };

  return (
    <>
      {/* The trail is deliberately free of `:id`. This route is served from
          one prerendered shell (`/beam/__contact.html`) for every id, and
          Solid's hydration adopts the server's DOM without rewriting
          attributes — so a param-derived `href` would render once with the
          `__id` build sentinel and stay frozen there until some unrelated
          update re-ran the effect. `useParams()` itself is correct on the
          client; it's only the prerendered markup that can't depend on it.
          The same rule binds anything this page renders from the id. */}
      <SiteHeader
        trail={[{ label: 'Beam', href: '/beam' }, { label: 'Contact' }]}
        actions={<ConnectionIndicator />}
      />
      <FrameBody>
        <Container as="div" size={2}>
          <Show
            when={contact()}
            fallback={
              // Only once the read has landed: before that, an unfound
              // contact means the book isn't loaded, not that it's missing.
              <Show when={settled()}>
                <Callout color="neutral">
                  <Text as="span" size={2} selectable={false}>
                    This device isn’t in your contacts.
                  </Text>
                </Callout>
              </Show>
            }
          >
            {(view) => (
              <Flex as="div" direction="column" gap={5}>
                {/* The rename control sits with the name it edits rather than
                    in the record below, which is a list of things you read.
                    An icon keeps it a fixed width, so a long name shortens
                    the heading instead of squeezing the button. */}
                <Flex
                  as="div"
                  direction="row"
                  align="start"
                  justify="between"
                  gap={3}
                >
                  <Flex as="hgroup" direction="column" gap={2}>
                    <Heading as="h1" class={styles.name} selectable={false}>
                      {view().name}
                    </Heading>

                    <Text
                      as="p"
                      size={2}
                      color="lowContrast"
                      selectable={false}
                    >
                      {describeTrust(view())}
                    </Text>
                  </Flex>

                  <IconButton
                    testId="beam-contact-rename"
                    aria-label="Rename this contact"
                    title="Rename this contact"
                    variant="soft"
                    color="neutral"
                    onClick={() => commit(renameOpenedTopic(params.id))}
                  >
                    <IconPencil width="18" height="18" aria-hidden="true" />
                  </IconButton>
                </Flex>

                {/* The same question the banner asks, in the one place that
                    also shows the endpoint key. A request waved off from the
                    banner still stands, so this is where it can be answered
                    against something that can't be spoofed. */}
                <Show
                  when={
                    view().trust === 'invited' && view().direction === 'inbound'
                  }
                >
                  <PairingRequest
                    testId="beam-contact-request"
                    contact={view()}
                  />
                </Show>

                <DataListRoot orientation="vertical" size={2}>
                  {/* Status leads the record. It's the one field that says
                      whether anything can happen with this contact yet. */}
                  <DataListItem>
                    <DataListLabel>Status</DataListLabel>
                    <DataListValue>
                      <Badge
                        color={
                          view().trust === 'trusted' ? 'success' : 'warning'
                        }
                        variant="soft"
                      >
                        {view().trust === 'trusted' ? 'Paired' : 'Pending'}
                      </Badge>
                    </DataListValue>
                  </DataListItem>
                  <DataListItem>
                    <DataListLabel>Endpoint key</DataListLabel>
                    <DataListValue>
                      <Badge
                        color="neutral"
                        variant="soft"
                        class={styles.endpointId}
                      >
                        {view().endpointId}
                      </Badge>
                    </DataListValue>
                  </DataListItem>
                  <DataListItem>
                    <DataListLabel>How you paired</DataListLabel>
                    <DataListValue>
                      {view().direction === 'outbound'
                        ? 'You opened their link'
                        : 'They opened your link'}
                    </DataListValue>
                  </DataListItem>
                  <DataListItem>
                    <DataListLabel>Added</DataListLabel>
                    <DataListValue>
                      {formatMoment(view().createdAt)}
                    </DataListValue>
                  </DataListItem>
                </DataListRoot>

                <Flex as="div" direction="column" gap={3} align="start">
                  <Button
                    testId="beam-contact-remove"
                    variant="soft"
                    color="danger"
                    onClick={() => commit(removalOpenedTopic(params.id))}
                  >
                    Remove
                  </Button>
                </Flex>

                <RenameDialog endpointId={view().endpointId} />

                {/* The name is in the question because the page it was asked
                    from is about to be left behind — the confirmation is the
                    last thing on screen that still says who this was. */}
                <AlertDialog
                  testId="beam-contact-remove-dialog"
                  open={removal().endpointId === view().endpointId}
                  onOpenChange={() => commit(removalClosedTopic())}
                  title="Remove this contact?"
                  description={`${view().name} drops out of your address book. Pairing again means trading links again.`}
                  actionText="Remove"
                  color="danger"
                  onAction={handleForget}
                />
              </Flex>
            )}
          </Show>
        </Container>
      </FrameBody>
    </>
  );
};
