import { Show } from 'solid-js';
import { useCommit, useValue } from '@lib/state';
import { FrameBody } from '@lib/shell';
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
import { ContactDirectory } from './contact-directory';
import { InviteDialog } from './invite-dialog';
import { contactsStore } from '../state/contacts';
import { inviteOpenedTopic } from '../state/session';
import * as styles from './beam-home.css';

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
  const commit = useCommit();

  return (
    <>
      <FrameBody>
        {/* Left-aligned rather than centered in the pane: the rail beside it
            starts at the top-left, and a column that floated to the middle
            would read as a second, unrelated surface. */}
        <Container as="div" size={3} align="start">
          <Flex as="div" direction="column" gap={6}>
            <Flex as="hgroup" direction="column" gap={2}>
              <Heading as="h1" size={8} selectable={false}>
                Beam
              </Heading>

              {/* Plain body text, not a second heading. The title above is
                  the only thing on the page with any typographic weight to
                  it; a subtitle competing at its own size would give the
                  reader two things to look at first.

                  It doesn't claim the traffic avoids a server — it doesn't.
                  A browser can't hole-punch, so every share goes through an
                  iroh relay; what the relay can't do is read it, which is
                  what "fully encrypted" is saying. */}
              <Text as="p" size={3} selectable={false}>
                Share text, links, and files between devices. Fully encrypted.
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

            {/* The book, inline — but only while there's no rail to hold it.
                Above `md` the frame's sidebar carries the same directory
                beside this page, and repeating it here would be the same
                list twice on one screen. */}
            <Flex as="div" direction="column" class={styles.directory}>
              <ContactDirectory testId="beam" />
            </Flex>

            <Flex as="div" gap={3} class={styles.actions}>
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
