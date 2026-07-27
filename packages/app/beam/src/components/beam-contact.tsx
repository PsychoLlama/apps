import { Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useCommit, useRun, useValue } from '@lib/state-next';
import { FrameBody, SiteHeader } from '@lib/shell';
import {
  Badge,
  Button,
  Callout,
  Code,
  Container,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
  Text,
  TextField,
} from '@lib/ui';
import {
  MAX_LABEL_LENGTH,
  addressBookFormula,
  blockContactSaga,
  contactsStore,
  forgetContactSaga,
  removalArmedTopic,
  removalDisarmedTopic,
  removalStore,
  renameContactSaga,
  unblockContactSaga,
  type ContactView,
} from '../state/contacts';
import { reportSagaFailure } from '../state/session';
import { ConnectionIndicator } from './connection-indicator';
import * as styles from './beam-contact.css';

/**
 * Ties the rename field to its label. A fixed id rather than a generated one:
 * only ever one contact renders at a time, so there's nothing to collide with.
 */
const NAME_FIELD_ID = 'beam-contact-name';

/** Dates read as dates, not timestamps. Follows the reader's locale. */
const formatMoment = (epochMilliseconds: number): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(epochMilliseconds);

/** How this contact's pairing stands, phrased from this device's side. */
const describeTrust = (contact: ContactView): string => {
  if (contact.trust === 'blocked') return 'Blocked. Nothing can be shared.';

  if (contact.trust === 'invited') {
    return contact.direction === 'outbound'
      ? 'Waiting for them to accept the invite.'
      : 'They asked to pair. Waiting on you.';
  }

  return 'Paired. Ready to share.';
};

/**
 * The contact detail view at `/beam/contacts/:id` — one peer's record: what
 * it's called, how the pairing began, and the controls to rename, block, or
 * forget it.
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

  const rename = useRun(renameContactSaga);
  const block = useRun(blockContactSaga);
  const unblock = useRun(unblockContactSaga);
  const forget = useRun(forgetContactSaga);

  /** The resolved view — the name, fragment, and dates the page renders. */
  const contact = () =>
    contacts().find((view) => view.endpointId === params.id);

  /** The raw local name, the one field the rename input edits directly. */
  const label = () => book().entries[params.id]?.label ?? '';

  /** Whether the read has landed, either way. Until then the page waits. */
  const settled = () => book().status === 'ready' || book().status === 'failed';

  const armed = () => removal().endpointId === params.id;

  const handleRename = (
    event: FocusEvent & { currentTarget: HTMLInputElement },
  ) => {
    const typed = event.currentTarget.value.trim();
    const next = typed.length > 0 ? typed : null;

    // Normalize what's on screen to what's being stored, so trailing spaces
    // (or a name emptied down to nothing) don't linger in the field.
    event.currentTarget.value = next ?? '';
    if (next === (book().entries[params.id]?.label ?? null)) return;

    void rename({ endpointId: params.id, label: next }).catch(
      reportSagaFailure('The contact rename saga failed.'),
    );
  };

  const handleForget = () => {
    void forget(params.id)
      .then(() => navigate('/beam'))
      .catch(reportSagaFailure('The contact forget saga failed.'));
  };

  const handleBlock = () => {
    void block(params.id).catch(
      reportSagaFailure('The contact block saga failed.'),
    );
  };

  const handleUnblock = () => {
    void unblock(params.id).catch(
      reportSagaFailure('The contact unblock saga failed.'),
    );
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
                <Flex as="hgroup" direction="column" gap={2} align="start">
                  <Heading as="h1" selectable={false}>
                    {view().name}
                  </Heading>

                  <Show when={view().trust !== 'trusted'}>
                    <Badge
                      color={view().trust === 'blocked' ? 'danger' : 'warning'}
                      variant="soft"
                    >
                      {view().trust === 'blocked' ? 'Blocked' : 'Pending'}
                    </Badge>
                  </Show>

                  <Text as="p" size={2} color="lowContrast" selectable={false}>
                    {describeTrust(view())}
                  </Text>
                </Flex>

                {/* Renaming saves on blur — there's one field and no other
                    way out of it, so a Save button would only be a second
                    thing to forget to press. An emptied field clears the
                    local name, which the placeholder then answers with
                    whatever the contact falls back to. */}
                <Flex as="div" direction="column" gap={2}>
                  <Text
                    as="label"
                    for={NAME_FIELD_ID}
                    size={2}
                    weight="medium"
                    selectable={false}
                  >
                    Name
                  </Text>
                  <TextField
                    testId="beam-contact-name"
                    id={NAME_FIELD_ID}
                    placeholder={view().name}
                    value={label()}
                    maxLength={MAX_LABEL_LENGTH}
                    onBlur={handleRename}
                    name="contact-name"
                    autocomplete="off"
                    autocapitalize="words"
                    enterkeyhint="done"
                  />
                </Flex>

                <DataListRoot orientation="vertical" size={2}>
                  <DataListItem>
                    <DataListLabel>Endpoint key</DataListLabel>
                    <DataListValue>
                      <Code
                        size={1}
                        color="neutral"
                        variant="ghost"
                        class={styles.endpointId}
                        selectable
                      >
                        {view().endpointId}
                      </Code>
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
                  <DataListItem>
                    <DataListLabel>Last seen</DataListLabel>
                    <DataListValue>
                      {formatMoment(view().lastSeenAt)}
                    </DataListValue>
                  </DataListItem>
                </DataListRoot>

                <Flex as="div" direction="column" gap={3} align="start">
                  <Show
                    when={view().trust === 'blocked'}
                    fallback={
                      <Button
                        testId="beam-contact-block"
                        variant="soft"
                        color="neutral"
                        onClick={handleBlock}
                      >
                        Block
                      </Button>
                    }
                  >
                    <Button
                      testId="beam-contact-unblock"
                      variant="soft"
                      color="neutral"
                      onClick={handleUnblock}
                    >
                      Unblock
                    </Button>
                  </Show>

                  {/* Forgetting is irreversible and there's no undo, so the
                      button arms before it fires. Walking away from the page
                      disarms it, which is the behaviour you'd want anyway. */}
                  <Show
                    when={armed()}
                    fallback={
                      <Button
                        testId="beam-contact-remove"
                        variant="soft"
                        color="danger"
                        onClick={() => commit(removalArmedTopic(params.id))}
                      >
                        Remove
                      </Button>
                    }
                  >
                    <Flex as="div" direction="row" gap={2} align="center">
                      <Button
                        testId="beam-contact-remove-confirm"
                        color="danger"
                        onClick={handleForget}
                      >
                        Remove for good
                      </Button>
                      <Button
                        testId="beam-contact-remove-cancel"
                        variant="ghost"
                        color="neutral"
                        onClick={() => commit(removalDisarmedTopic())}
                      >
                        Cancel
                      </Button>
                    </Flex>
                  </Show>
                </Flex>
              </Flex>
            )}
          </Show>
        </Container>
      </FrameBody>
    </>
  );
};
