import { Show } from 'solid-js';
import { useValue } from '@lib/state';
import { Flex, Heading, Text } from '@lib/ui';
import { ContactList } from './contact-list';
import { addressBookFormula, contactsStore } from '../state/contacts';
import { activeContactsFormula, queuedSharesFormula } from '../state/session';

/**
 * The address book, as the two lists it reads as. Rendered twice at different
 * sizes — inline on the home page for a phone, and in the frame's sidebar on
 * a wide screen — so the two can't drift into two different address books.
 *
 * Only one is ever visible; the media query in each host decides which. Both
 * stay in the markup, which is what keeps this working under SSG: the choice
 * is CSS, so a prerendered page is correct at every width before any script
 * runs.
 *
 * `testId` prefixes the lists rather than naming one, since both copies are in
 * the DOM at once and a test reaching for a row needs to say which it meant.
 */
export const ContactDirectory = (props: { testId: string }) => {
  const book = useValue(contactsStore);
  const contacts = useValue(addressBookFormula);
  const active = useValue(activeContactsFormula);
  const queued = useValue(queuedSharesFormula);

  return (
    <Flex as="div" direction="column" gap={5}>
      {/* Only claim there's nothing paired once the book has actually been
          read. Between mount and the IndexedDB read landing there's no answer
          yet, and "no devices yet" is the wrong one. */}
      <Show when={book().status === 'ready' && contacts().length === 0}>
        <Text as="p" size={2} color="lowContrast" selectable={false}>
          No devices yet. Share an invite, or scan one to pair.
        </Text>
      </Show>

      {/* Devices that are awake and paired, lifted out of the book below. It
          repeats rows rather than moving them: the book is where a device
          lives, and a list that reshuffled itself as peers came and went would
          be a worse place to look one up. What this list adds is the shortlist
          — the devices a tap actually reaches right now — not a different
          destination.

          Only rendered when there's something in it, which is every first
          paint — nothing is linked until something dials. */}
      <Show when={active().length > 0}>
        <Flex as="section" direction="column" gap={3}>
          <Heading as="h2" size={3} selectable={false}>
            Active
          </Heading>

          <ContactList
            testId={`${props.testId}-active`}
            label="Devices you can share with now"
            contacts={active()}
            queued={queued()}
          />
        </Flex>
      </Show>

      <Show when={contacts().length > 0}>
        <Flex as="section" direction="column" gap={3}>
          {/* The book only needs naming once something sits above it. On its
              own it's the whole list. */}
          <Show when={active().length > 0}>
            <Heading as="h2" size={3} selectable={false}>
              All devices
            </Heading>
          </Show>

          <ContactList
            testId={`${props.testId}-contacts`}
            label="Contacts"
            contacts={contacts()}
            queued={queued()}
          />
        </Flex>
      </Show>
    </Flex>
  );
};
