import { Show } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import { Dialog, Flex, TextField } from '@lib/ui';
import { $closeInvite } from '../effects';
import { $invite } from '../state';
import { QrCode } from './qr-code';

/**
 * An invitation to a group, as a modal: a code for the other device's
 * camera, and the same link in a field to copy.
 *
 * A dialog because it's an errand that ends on someone else's screen, and
 * because the invitation lives exactly as long as it's showing. Closing
 * the dialog takes it back, so a code that was photographed and never used
 * stops working.
 */
export const InviteDialog = () => {
  const invite = useValue($invite);
  const closeInvite = useAction($closeInvite);

  return (
    <Dialog
      testId="invite-dialog"
      open={invite() !== null}
      onOpenChange={() => closeInvite()}
      title="Link a device"
      description="Scan this with the other device, or open the link on it. It works once, while this stays open."
      maxWidth="24rem"
    >
      <Show when={invite()}>
        {(shown) => (
          <Flex as="div" direction="column" gap={4}>
            {/* The plate sizes itself to the code, so the row does the
                centering. */}
            <Show when={shown().grid}>
              {(grid) => (
                <Flex as="div" direction="row" justify="center">
                  <QrCode grid={grid()} label="QR code for the invitation" />
                </Flex>
              )}
            </Show>

            {/* Selecting on focus makes the copy one keystroke, and leaves
                the field showing the start of the link rather than the
                tail of the code. */}
            <TextField
              testId="invite-link"
              readOnly
              aria-label="Invitation link"
              value={shown().link}
              onFocus={(event) => {
                event.currentTarget.select();
                event.currentTarget.scrollLeft = 0;
              }}
              name="invite-link"
              autocomplete={undefined}
              autocapitalize={undefined}
              enterkeyhint={undefined}
            />
          </Flex>
        )}
      </Show>
    </Dialog>
  );
};
