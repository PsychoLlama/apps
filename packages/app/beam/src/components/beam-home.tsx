import { Show } from 'solid-js';
import { useCommit, useValue } from '@lib/state';
import { FrameBody, SiteHeader } from '@lib/shell';
import {
  Button,
  Callout,
  Container,
  Flex,
  Heading,
  LinkButton,
  Text,
} from '@lib/ui';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconShareVariant from 'virtual:icons/mdi/share-variant-outline';
import { ContactList } from './contact-list';
import { InviteDialog } from './invite-dialog';
import { addressBookFormula, contactsStore } from '../state/contacts';
import {
  activeContactsFormula,
  inviteOpenedTopic,
  queuedSharesFormula,
  selfLabelFormula,
} from '../state/session';

/**
 * The Beam home at `/beam` — the address book, and the app's entry point. It
 * lists the peers this device has paired with and offers the two ways to add
 * another: show an invite for someone else to scan, or scan theirs.
 *
 * It also answers the two questions you'd otherwise have to open a device's
 * page to ask: which of them are reachable right now, and whether anything
 * is still waiting to reach one.
 *
 * Scanning is delegated wholesale to `@app/qr-scanner`: a beam link is a
 * same-origin URL, which the scanner already resolves to an in-app route, so
 * the tap lands back here at `/beam/share/:id`.
 */
export const BeamHome = () => {
  const book = useValue(contactsStore);
  const contacts = useValue(addressBookFormula);
  const active = useValue(activeContactsFormula);
  const queued = useValue(queuedSharesFormula);
  const selfLabel = useValue(selfLabelFormula);
  const commit = useCommit();

  return (
    <>
      {/* The name sits in the header rather than in the copy below it. It's
          this device's identity, which is chrome, and putting it here leaves
          the headline free to say what the page is for. It's derived from the
          endpoint key, so it turns up as soon as the key is loaded rather than
          waiting on the relay; until then the tray is empty, since a
          placeholder name is a lie someone might read out to the person beside
          them. */}
      <SiteHeader
        title="Beam"
        actions={
          <Show when={selfLabel()}>
            {(label) => (
              <Text
                as="span"
                size={2}
                color="lowContrast"
                title="The name other devices see you by"
                selectable
              >
                {label()}
              </Text>
            )}
          </Show>
        }
      />
      <FrameBody>
        <Container as="div" size={2}>
          <Flex as="div" direction="column" gap={5}>
            <Flex as="hgroup" direction="column" gap={2}>
              <Heading as="h1" selectable={false}>
                Beam
              </Heading>

              <Text as="p" size={2} color="lowContrast" selectable={false}>
                Share links and files with your other devices.
              </Text>
            </Flex>

            <Show when={book().status === 'failed'}>
              <Callout color="warning">
                <Text as="span" size={2} selectable={false}>
                  Your contacts couldn’t be loaded. Pairing still works, but
                  nothing will be remembered.
                </Text>
              </Callout>
            </Show>

            {/* Only claim there's nothing paired once the book has actually
                been read. Between mount and the IndexedDB read landing there's
                no answer yet, and "no devices yet" is the wrong one. */}
            <Show when={book().status === 'ready' && contacts().length === 0}>
              <Text as="p" size={2} color="lowContrast" selectable={false}>
                No devices yet. Share an invite, or scan one to pair.
              </Text>
            </Show>

            {/* Devices that are awake and paired, lifted out of the book
                below. It repeats rows rather than moving them: the book is
                where a device lives, and a list that reshuffled itself as
                peers came and went would be a worse place to look one up.
                Rows here lead to sharing rather than to the record, because
                that's the only reason to care that a device is reachable.

                Only rendered when there's something in it, which is every
                first paint — nothing is linked until something dials. */}
            <Show when={active().length > 0}>
              <Flex as="section" direction="column" gap={3}>
                <Heading as="h2" size={3} selectable={false}>
                  Active
                </Heading>

                <ContactList
                  testId="beam-active"
                  label="Devices you can share with now"
                  contacts={active()}
                  destination="share"
                  queued={queued()}
                />
              </Flex>
            </Show>

            <Show when={contacts().length > 0}>
              <Flex as="section" direction="column" gap={3}>
                {/* The book only needs naming once something sits above it.
                    On its own it's the page. */}
                <Show when={active().length > 0}>
                  <Heading as="h2" size={3} selectable={false}>
                    All devices
                  </Heading>
                </Show>

                <ContactList
                  testId="beam-contacts"
                  label="Contacts"
                  contacts={contacts()}
                  queued={queued()}
                />
              </Flex>
            </Show>

            <Flex as="div" direction="column" gap={3}>
              <Button
                testId="beam-invite"
                size={3}
                onClick={() => commit(inviteOpenedTopic())}
              >
                <IconShareVariant width="20" height="20" aria-hidden="true" />
                Share an invite
              </Button>
              <LinkButton
                testId="beam-scan"
                href="/scanner"
                size={3}
                variant="soft"
              >
                <IconQrcodeScan width="20" height="20" aria-hidden="true" />
                Scan a code
              </LinkButton>
            </Flex>
          </Flex>
        </Container>
      </FrameBody>

      <InviteDialog />
    </>
  );
};
