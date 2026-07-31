import { Show } from 'solid-js';
import { useValue } from '@lib/state';
import { Em, Flex, Heading, Text } from '@lib/ui';
import { ContactList } from './contact-list';
import { addressBookFormula, contactsStore } from '../state/contacts';
import { activePeersFormula, queuedSharesFormula } from '../state/session';

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
  const queued = useValue(queuedSharesFormula);

  return (
    <Flex as="div" direction="column" gap={3}>
      {/* The list names itself rather than leaning on the page around it.
          Only one of the two copies is ever visible, and the sidebar's has no
          page of its own to be titled by.

          Indented by a row's own inline padding so the title sits over the
          names rather than a few pixels to their left — the rows are buttons,
          and a button's padding is inside its hit area rather than around
          it. */}
      <Heading as="h2" size={3} mx={3} selectable={false}>
        Contacts
      </Heading>

      {/* Only claim there's nothing paired once the book has actually been
          read. Between mount and the IndexedDB read landing there's no answer
          yet, and "no contacts" is the wrong one.

          Centered, so it reads as the list's own empty middle rather than as
          a line of prose the heading introduces. It says only what's true and
          nothing about what to do — the invite and scan buttons are already
          on the page saying that. */}
      <Show when={book().status === 'ready' && contacts().length === 0}>
        <Text
          as="p"
          size={2}
          align="center"
          color="lowContrast"
          selectable={false}
        >
          <Em>No contacts</Em>
        </Text>
      </Show>

      <ContactList
        testId={`${props.testId}-contacts`}
        contacts={contacts()}
        queued={queued()}
        active={active()}
      />
    </Flex>
  );
};
