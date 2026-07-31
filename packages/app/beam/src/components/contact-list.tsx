import { For, Show } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { Badge, Card, Flex, Link } from '@lib/ui';
import type { ContactView } from '../state/contacts';
import * as styles from './contact-list.css';

/**
 * One contact, as a row in the address book. The name is the row's link and
 * stretches its hit area over the whole card.
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
    <Card
      as="li"
      size={2}
      class={current() ? `${styles.row} ${styles.currentRow}` : styles.row}
    >
      <Flex as="div" direction="row" align="center" justify="between" gap={3}>
        <Link
          testId="beam-contact-link"
          href={href()}
          class={styles.stretchedLink}
          color="neutral"
          weight="medium"
          underline="none"
          aria-current={current() ? 'page' : undefined}
        >
          {props.contact.name}
        </Link>

        {/* Something written to this device that hasn't reached it. Worth
          seeing from the list: the alternative is finding out by opening the
          page you'd only open if you already suspected. */}
        <Show when={props.queued > 0}>
          <Badge color="accent" variant="soft">
            {props.queued} queued
          </Badge>
        </Show>

        {/* Reachable right now — the one thing about a row that changes on
          its own while you're looking at it. It marks the row in place
          rather than lifting it into a list of its own, so the book stays a
          book: the same devices in the same order, whoever happens to be
          awake. Only one of these two can ever show, since reachable means
          paired. */}
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
    </Card>
  );
};

/**
 * A list of contacts. Renders nothing at all when it's empty, so the caller
 * can hand it a book that may or may not have anything in it without
 * guarding first.
 *
 * Every row leads to the same place: tapping a contact is going to share with
 * it. The record behind it is one hop further on, from the share view's own
 * Details link — renaming and forgetting are errands you go looking for, not
 * the reason anyone opens the address book.
 */
export const ContactList = (props: {
  contacts: ContactView[];
  testId: string;
  /** What the list is, for anyone not reading it visually. */
  label: string;
  /** Shares still waiting to go out, by endpoint id. */
  queued?: Record<string, number>;
  /** Peers reachable right now, by endpoint id. */
  active?: Record<string, true>;
}) => (
  <Show when={props.contacts.length > 0}>
    <Flex
      as="ul"
      direction="column"
      gap={2}
      data-testid={props.testId}
      aria-label={props.label}
    >
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
