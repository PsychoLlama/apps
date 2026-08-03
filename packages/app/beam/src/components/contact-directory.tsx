import { Show } from 'solid-js';
import { useValue } from '@lib/state';
import { Flex, Heading, Text } from '@lib/ui';
import { ContactList } from './contact-list';
import { addressBookFormula, contactsStore } from '../state/contacts';
import { activePeersFormula } from '../state/network';
import * as styles from './contact-directory.css';

/**
 * The address book. Rendered twice at different sizes — inline on the home
 * page for a phone, and in the frame's sidebar on a wide screen — so the two
 * can't drift into two different address books.
 *
 * Only one is ever visible; the media query in each host decides which. Both
 * stay in the markup, which is what keeps this working under SSG: the choice
 * is CSS, so a prerendered page is correct at every width before any script
 * runs.
 *
 * One list, in one order. Which devices are awake is a property of a row,
 * carried by a badge on it, rather than a second list above the first — a
 * shortlist that repeats rows says the same names twice, and one that moved
 * them would reshuffle itself as peers came and went, under the pointer of
 * someone trying to find a device by where it was last time.
 *
 * `testId` prefixes the list rather than naming it, since both copies are in
 * the DOM at once and a test reaching for a row needs to say which it meant.
 */
export const ContactDirectory = (props: { testId: string }) => {
  const book = useValue(contactsStore);
  const contacts = useValue(addressBookFormula);
  const active = useValue(activePeersFormula);

  return (
    <Flex as="div" direction="column" gap={3} grow>
      {/* The list names itself rather than leaning on the page around it.
          Only one of the two copies is ever visible, and the sidebar's has no
          page of its own to be titled by.

          Where it sits inline depends on what's holding it — see the
          stylesheet. */}
      <Heading as="h2" size={5} class={styles.heading} selectable={false}>
        Contacts
      </Heading>

      {/* Only claim there's nothing paired once the book has actually been
          read. Between mount and the IndexedDB read landing there's no answer
          yet, and "no contacts" is the wrong one.

          It fills whatever room the list would have had and centers in it, so
          in the rail it sits in the empty middle rather than hanging under
          the heading. Plain, and quietly — it's a statement of fact, not a
          line worth stressing, and it says nothing about what to do because
          the invite and scan buttons are already on the page saying that. */}
      <Show when={book().status === 'ready' && contacts().length === 0}>
        <Flex as="div" direction="column" justify="center" align="center" grow>
          <Text as="p" size={2} color="lowContrast" selectable={false}>
            No contacts
          </Text>
        </Flex>
      </Show>

      <ContactList
        testId={`${props.testId}-contacts`}
        contacts={contacts()}
        active={active()}
      />
    </Flex>
  );
};
