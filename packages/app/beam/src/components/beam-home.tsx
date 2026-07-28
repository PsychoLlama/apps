import { Show } from 'solid-js';
import { useValue } from '@lib/state-next';
import { FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Flex, Heading, LinkButton, Text } from '@lib/ui';
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

  return (
    <>
      {/* The name sits in the header rather than in the copy below it. It's
          this device's identity, which is chrome — the same class of thing as
          the connection status it sits beside — and putting it here leaves the
          headline free to say what the page is for. It only exists once the
          relay connection lands, so the tray simply holds the status alone
          until then; a placeholder name is a lie someone might read out to the
          person beside them. */}
      <SiteHeader
        title="Beam"
        actions={
          <>
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
            <ConnectionIndicator />
          </>
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

            <ContactList testId="beam-contacts" contacts={contacts()} />

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
          </Flex>
        </Container>
      </FrameBody>
    </>
  );
};
