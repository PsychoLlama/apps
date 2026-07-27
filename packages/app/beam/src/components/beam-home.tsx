import { Show } from 'solid-js';
import { useValue } from '@lib/state-next';
import { FrameBody, SiteHeader } from '@lib/shell';
import {
  Callout,
  Container,
  Flex,
  Heading,
  LinkButton,
  Strong,
  Text,
} from '@lib/ui';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconShareVariant from 'virtual:icons/mdi/share-variant-outline';
import { ConnectionIndicator } from './connection-indicator';
import { ContactList } from './contact-list';
import { addressBookFormula, contactsStore } from '../state/contacts';
import { selfLabelFormula } from '../state/session';

/**
 * The Beam home at `/beam` — the address book, and the app's entry point. It
 * lists the peers this device has paired with and offers the two ways to add
 * another: show an invite for someone else to scan, or scan theirs.
 *
 * Scanning is delegated wholesale to `@app/qr-scanner`: a beam link is a
 * same-origin URL, which the scanner already resolves to an in-app route, so
 * the tap lands back here at `/beam/share/:id`.
 */
export const BeamHome = () => {
  const book = useValue(contactsStore);
  const contacts = useValue(addressBookFormula);
  const selfLabel = useValue(selfLabelFormula);

  const paired = () => contacts().filter((view) => view.trust !== 'blocked');
  const blocked = () => contacts().filter((view) => view.trust === 'blocked');

  return (
    <>
      <SiteHeader title="Beam" actions={<ConnectionIndicator />} />
      <FrameBody>
        <Container as="div" size={2}>
          <Flex as="div" direction="column" gap={5}>
            <Flex as="hgroup" direction="column" gap={2}>
              <Heading as="h1" selectable={false}>
                Beam
              </Heading>

              {/* The name is generated from this device's endpoint key, so it
                  only exists once the relay connection lands. Until then the
                  line says what the page is for instead — a placeholder name
                  is a lie someone might read out to the person beside them. */}
              <Show
                when={selfLabel()}
                fallback={
                  <Text as="p" size={2} color="lowContrast" selectable={false}>
                    Share links and files with your other devices.
                  </Text>
                }
              >
                {(label) => (
                  <Text as="p" size={2} color="lowContrast" selectable={false}>
                    Other devices see you as <Strong>{label()}</Strong>.
                  </Text>
                )}
              </Show>
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
                no answer yet, and "no devices yet" is the wrong one. Blocked
                contacts don't count — they have their own section, and a book
                holding only refusals still has nothing to share with. */}
            <Show when={book().status === 'ready' && paired().length === 0}>
              <Text as="p" size={2} color="lowContrast" selectable={false}>
                No devices yet. Share an invite, or scan one to pair.
              </Text>
            </Show>

            <ContactList testId="beam-contacts" contacts={paired()} />

            <Flex as="div" direction="column" gap={3}>
              <LinkButton testId="beam-invite" href="/beam/invite" size={3}>
                <IconShareVariant width="20" height="20" aria-hidden="true" />
                Share an invite
              </LinkButton>
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

            <ContactList
              testId="beam-blocked"
              heading="Blocked"
              contacts={blocked()}
            />
          </Flex>
        </Container>
      </FrameBody>
    </>
  );
};
