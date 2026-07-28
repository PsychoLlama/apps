import { Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useRun, useValue } from '@lib/state-next';
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
  addressBookFormula,
  contactsStore,
  forgetContactSaga,
  renameContactSaga,
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
  if (contact.trust === 'trusted') return 'Paired. Ready to share.';

  return contact.direction === 'outbound'
    ? 'Waiting for them to accept the invite.'
    : 'They asked to pair. Waiting on you.';
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

  const rename = useRun(renameContactSaga);
  const forget = useRun(forgetContactSaga);

  /** The resolved view — the name and dates the page renders. */
  const contact = () =>
    contacts().find((view) => view.endpointId === params.id);

  /** The raw local name, the one field the rename input edits directly. */
  const label = () => book().entries[params.id]?.label ?? '';

  /** Whether the read has landed, either way. Until then the page waits. */
  const settled = () => book().status === 'ready' || book().status === 'failed';

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
                  <Heading as="h1" class={styles.name} selectable={false}>
                    {view().name}
                  </Heading>

                  <Show when={view().trust !== 'trusted'}>
                    <Badge color="warning" variant="soft">
                      Pending
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
                </DataListRoot>

                {/* Removing takes effect on the press. There's nothing here
                    to lose: a contact is a name over a public key, and the
                    peer can be paired with again from the same link. */}
                <Flex as="div" direction="column" gap={3} align="start">
                  <Button
                    testId="beam-contact-remove"
                    variant="soft"
                    color="danger"
                    onClick={handleForget}
                  >
                    Remove
                  </Button>
                </Flex>
              </Flex>
            )}
          </Show>
        </Container>
      </FrameBody>
    </>
  );
};
