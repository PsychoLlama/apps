import { For, Show } from 'solid-js';
import { Badge, Card, Flex, Link } from '@lib/ui';
import type { ContactView } from '../state/contacts';
import * as styles from './contact-list.css';

/**
 * One contact, as a row in the address book. The name is the row's link and
 * stretches its hit area over the whole card.
 *
 * A name has no length limit, so the row holds the line by truncating: the
 * badge keeps its width and the name gives way, rather than a long name
 * pushing the row's own status off the edge of the screen.
 */
const ContactRow = (props: { contact: ContactView }) => (
  <Card as="li" size={2} class={styles.row}>
    <Flex as="div" direction="row" align="center" justify="between" gap={3}>
      <Link
        testId="beam-contact-link"
        href={`/beam/contacts/${props.contact.endpointId}`}
        class={styles.stretchedLink}
        color="neutral"
        weight="medium"
        underline="none"
      >
        {props.contact.name}
      </Link>

      <Show when={props.contact.trust !== 'trusted'}>
        <Badge color="warning" variant="soft">
          {props.contact.direction === 'outbound' ? 'Invited' : 'Requested'}
        </Badge>
      </Show>
    </Flex>
  </Card>
);

/**
 * The address book as a list. Renders nothing at all when it's empty, so the
 * caller can hand it a book that may or may not have anything in it without
 * guarding first.
 */
export const ContactList = (props: {
  contacts: ContactView[];
  testId: string;
}) => (
  <Show when={props.contacts.length > 0}>
    <Flex
      as="ul"
      direction="column"
      gap={2}
      data-testid={props.testId}
      aria-label="Contacts"
    >
      <For each={props.contacts}>
        {(contact) => <ContactRow contact={contact} />}
      </For>
    </Flex>
  </Show>
);
