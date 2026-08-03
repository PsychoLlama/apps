import { For, Show } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { Badge, Flex, LinkButton, Text } from '@lib/ui';
import type { ContactView } from '../state/contacts';
import * as styles from './contact-list.css';

/**
 * One contact, as a row in the address book. The row *is* the link: a
 * full-width button rather than a card with an anchor inside it. A card draws
 * a surface around each contact as though the row were a thing to read, and
 * the surfaces stack up into a page of boxes; an address book is a list of
 * places to go, so the rows are the plainest thing that can be tapped and sit
 * flush against each other.
 *
 * Ghost for the same reason — a row is only ever an invitation to go
 * somewhere, so it stays out of the way until it's pointed at.
 *
 * A name has no length limit, so the row holds the line by truncating: the
 * badge keeps its width and the name gives way, rather than a long name
 * pushing the row's own status off the edge of the screen.
 *
 * The row marks itself when its peer is the one on screen. That only shows
 * anywhere the list is still visible while its destination is open, which is
 * the sidebar — but it's the row that knows its own `href`, so the test lives
 * here rather than being threaded down from whichever list is hosting it.
 */
const ContactRow = (props: { contact: ContactView; active: boolean }) => {
  const location = useLocation();

  const href = () => `/beam/share/${props.contact.endpointId}`;

  /** Whether this row's peer is the one the pane is showing. */
  const current = () => location.pathname === href();

  return (
    <Flex as="li" direction="column">
      {/* Being current is a change of color, not a fill behind the text. A
          tinted row would read as a surface again — the thing these stopped
          being — and it would be competing with the hover fill for the same
          background. Recoloring leaves hover free to mean "under the
          pointer" and current to mean "already open". */}
      <LinkButton
        testId="beam-contact-link"
        href={href()}
        class={styles.row}
        size={3}
        variant="ghost"
        radius="none"
        color={current() ? 'accent' : 'neutral'}
        aria-current={current() ? 'page' : undefined}
      >
        <Text
          as="span"
          weight="medium"
          class={styles.name}
          truncate
          selectable={false}
        >
          {props.contact.name}
        </Text>

        {/* Reachable right now — the one thing about a row that changes on
            its own while you're looking at it, and the only thing the list
            says about a contact beyond its name. It marks the row in place
            rather than lifting it into a list of its own, so the book stays
            a book: the same devices in the same order, whoever happens to be
            awake.

            A pill rather than a rounded rectangle. The badge is a state
            light, not a control, and at this size a full radius is what
            keeps it from reading as something to press. */}
        <Show when={props.active}>
          <Badge color="success" variant="soft" radius="full">
            Active
          </Badge>
        </Show>
      </LinkButton>
    </Flex>
  );
};

/**
 * A list of contacts. Renders nothing at all when it's empty, so the caller
 * can hand it a book that may or may not have anything in it without
 * guarding first.
 *
 * The rows butt up against each other with no gap between them. They carry no
 * surface of their own, so a gap would only be space between two pieces of
 * nothing — where flush rows read as one list and give each hover fill an
 * edge to meet.
 *
 * Every row leads to the same place: tapping a contact is going to share with
 * it. That page carries the record too — the key, the date, and the controls
 * to rename or forget — so the list has one destination rather than a
 * destination and an errand hanging off it.
 */
export const ContactList = (props: {
  contacts: ContactView[];
  testId: string;
  /** Peers reachable right now, by endpoint id. */
  active?: Record<string, true>;
}) => (
  <Show when={props.contacts.length > 0}>
    <Flex as="ul" direction="column" testId={props.testId}>
      <For each={props.contacts}>
        {(contact) => (
          <ContactRow
            contact={contact}
            active={props.active?.[contact.endpointId] ?? false}
          />
        )}
      </For>
    </Flex>
  </Show>
);
