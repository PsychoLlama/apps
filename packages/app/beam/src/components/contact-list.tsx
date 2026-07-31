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
 * badges keep their width and the name gives way, rather than a long name
 * pushing the row's own status off the edge of the screen.
 *
 * The row marks itself when its peer is the one on screen. That only shows
 * anywhere the list is still visible while its destination is open, which is
 * the sidebar — but it's the row that knows its own `href`, so the test lives
 * here rather than being threaded down from whichever list is hosting it.
 */
const ContactRow = (props: {
  contact: ContactView;
  queued: number;
  active: boolean;
}) => {
  const location = useLocation();

  const href = () => `/beam/share/${props.contact.endpointId}`;

  /** Whether this row's peer is the one the pane is showing. */
  const current = () => location.pathname === href();

  return (
    <Flex as="li" direction="column">
      {/* The current row switches color rather than being tinted on top of
          the neutral one, so its text and its pressed state come along with
          the fill instead of each needing a rule of its own. */}
      <LinkButton
        testId="beam-contact-link"
        href={href()}
        class={current() ? `${styles.row} ${styles.currentRow}` : styles.row}
        size={3}
        variant="ghost"
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

        <Flex as="div" direction="row" align="center" gap={2}>
          {/* Something written to this device that hasn't reached it. Worth
              seeing from the list: the alternative is finding out by opening
              the page you'd only open if you already suspected. */}
          <Show when={props.queued > 0}>
            <Badge color="accent" variant="soft">
              {props.queued} queued
            </Badge>
          </Show>

          {/* Reachable right now — the one thing about a row that changes on
              its own while you're looking at it. It marks the row in place
              rather than lifting it into a list of its own, so the book stays
              a book: the same devices in the same order, whoever happens to
              be awake. Only one of these two can ever show, since reachable
              means paired. */}
          <Show when={props.active}>
            <Badge color="success" variant="soft">
              Active
            </Badge>
          </Show>

          <Show when={props.contact.trust !== 'trusted'}>
            <Badge color="warning" variant="soft">
              {props.contact.direction === 'outbound' ? 'Invited' : 'Requested'}
            </Badge>
          </Show>
        </Flex>
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
 * it. The record behind it is one hop further on, from the share view's own
 * Details link — renaming and forgetting are errands you go looking for, not
 * the reason anyone opens the address book.
 */
export const ContactList = (props: {
  contacts: ContactView[];
  testId: string;
  /** Shares still waiting to go out, by endpoint id. */
  queued?: Record<string, number>;
  /** Peers reachable right now, by endpoint id. */
  active?: Record<string, true>;
}) => (
  <Show when={props.contacts.length > 0}>
    <Flex as="ul" direction="column" testId={props.testId}>
      <For each={props.contacts}>
        {(contact) => (
          <ContactRow
            contact={contact}
            queued={props.queued?.[contact.endpointId] ?? 0}
            active={props.active?.[contact.endpointId] ?? false}
          />
        )}
      </For>
    </Flex>
  </Show>
);
