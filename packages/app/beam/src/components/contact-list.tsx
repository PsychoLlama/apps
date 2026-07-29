import { For, Show } from 'solid-js';
import { Badge, Card, Flex, Link } from '@lib/ui';
import type { ContactView } from '../state/contacts';
import * as styles from './contact-list.css';

/** Where a row leads. */
type Destination = 'contact' | 'share';

/**
 * One contact, as a row in the address book. The name is the row's link and
 * stretches its hit area over the whole card.
 *
 * A name has no length limit, so the row holds the line by truncating: the
 * badges keep their width and the name gives way, rather than a long name
 * pushing the row's own status off the edge of the screen.
 */
const ContactRow = (props: {
  contact: ContactView;
  destination: Destination;
  queued: number;
}) => (
  <Card as="li" size={2} class={styles.row}>
    <Flex as="div" direction="row" align="center" justify="between" gap={3}>
      <Link
        testId="beam-contact-link"
        href={
          props.destination === 'share'
            ? `/beam/share/${props.contact.endpointId}`
            : `/beam/contacts/${props.contact.endpointId}`
        }
        class={styles.stretchedLink}
        color="neutral"
        weight="medium"
        underline="none"
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

      <Show when={props.contact.trust !== 'trusted'}>
        <Badge color="warning" variant="soft">
          {props.contact.direction === 'outbound' ? 'Invited' : 'Requested'}
        </Badge>
      </Show>
    </Flex>
  </Card>
);

/**
 * A list of contacts. Renders nothing at all when it's empty, so the caller
 * can hand it a book that may or may not have anything in it without
 * guarding first.
 *
 * Used for both the address book and the shorter list of devices that are
 * reachable right now, which differ in where a row leads: browsing the book
 * is looking someone up, and tapping a device that's awake is going to share
 * with it.
 */
export const ContactList = (props: {
  contacts: ContactView[];
  testId: string;
  /** What the list is, for anyone not reading it visually. */
  label: string;
  /** Where a row leads. Defaults to the contact's record. */
  destination?: Destination;
  /** Shares still waiting to go out, by endpoint id. */
  queued?: Record<string, number>;
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
            destination={props.destination ?? 'contact'}
            queued={props.queued?.[contact.endpointId] ?? 0}
          />
        )}
      </For>
    </Flex>
  </Show>
);
