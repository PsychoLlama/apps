import { Show } from 'solid-js';
import { useCommit, useValue } from '@lib/state';
import { FrameBody } from '@lib/shell';
import { Button, Callout, Flex, LinkButton, Text } from '@lib/ui';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconShareVariant from 'virtual:icons/mdi/share-variant-outline';
import { BeamIntro } from '../components/beam-intro';
import { ContactDirectory } from '../components/contact-directory';
import { InviteDialog } from '../components/invite-dialog';
import { contactsStore } from '../state/contacts';
import { inviteOpenedTopic } from '../state/view';
import * as styles from './home.css';

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
const BeamHome = () => {
  const book = useValue(contactsStore);
  const commit = useCommit();

  return (
    <>
      <FrameBody>
        {/* No column cap. The pane is already as narrow as the rail beside it
            leaves it, and capping it again would float the page inside its
            own frame — a second margin inside a margin, with the address book
            butted up against the outer one. */}
        <Flex as="div" direction="column" gap={6}>
          <BeamIntro />

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
      </FrameBody>

      <InviteDialog />
    </>
  );
};

export default BeamHome;
