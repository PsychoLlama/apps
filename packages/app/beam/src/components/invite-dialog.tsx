import { Show } from 'solid-js';
import { useCommit, useValue } from '@lib/state';
import { Dialog, Flex, Text, TextField } from '@lib/ui';
import { QrCode } from './qr-code';
import {
  beamLink,
  identityStore,
  inviteClosedTopic,
  inviteStore,
  qrCodeCell,
} from '../state/session';

/**
 * This device's beam link, as a modal. Two ways to hand the same URL over: a
 * read-only field to copy, and a QR code beneath it for a peer to scan.
 *
 * Both hang off this device's identity rather than its relay connection. The
 * link is the address the key implies, so it's true the moment the key is
 * loaded and stays true whether or not the handshake ever lands — and a peer
 * who scans early simply dials a device that's still coming up. The code
 * follows a beat later, since it has an encoder of its own to instantiate.
 *
 * A dialog rather than a page. An invite is a thirty-second errand that ends
 * on someone else's screen — routing to it cost a navigation each way and put
 * the address book away while you were reading a link out loud.
 */
export const InviteDialog = () => {
  const invite = useValue(inviteStore);
  const self = useValue(identityStore);
  const grid = useValue(qrCodeCell);
  const commit = useCommit();

  return (
    <Dialog
      testId="beam-invite-dialog"
      open={invite().open}
      onOpenChange={() => commit(inviteClosedTopic())}
      title="Beam link"
      description="Open this link on another device, or scan the code."
      maxWidth="24rem"
    >
      <Show
        when={self().endpointId}
        fallback={
          <Text as="p" size={2} color="lowContrast" selectable={false}>
            Preparing this device’s link…
          </Text>
        }
      >
        {(endpointId) => (
          <Flex as="div" direction="column" gap={4}>
            {/* The platform focuses the first focusable child on open, which
                for a read-only field means a caret parked past the end of a
                64-character key — the tail of the URL on screen and nothing
                selected. Selecting it backwards makes the copy one keystroke
                and leaves the caret at the start, so the field shows the
                beginning of the link rather than its last few bytes. */}
            <TextField
              testId="beam-link"
              readOnly
              aria-label="Beam link"
              value={beamLink(endpointId())}
              onFocus={(event) => {
                event.currentTarget.select();
                event.currentTarget.scrollLeft = 0;
              }}
              name="endpoint-id"
              autocomplete={undefined}
              autocapitalize={undefined}
              enterkeyhint={undefined}
            />

            {/* The plate sizes itself to the code, so the row does the
                centering — the code is the thing you point a camera at, and
                it reads as an aside when it's pinned to one edge. */}
            <Show when={grid()}>
              {(code) => (
                <Flex as="div" direction="row" justify="center">
                  <QrCode grid={code()} label="QR code for the beam link" />
                </Flex>
              )}
            </Show>
          </Flex>
        )}
      </Show>
    </Dialog>
  );
};
