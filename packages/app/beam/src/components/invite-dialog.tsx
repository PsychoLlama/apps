import { createEffect, Show } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import { Dialog, Flex, TextField } from '@lib/ui';
import { $feed, $invite, $inviteClosed } from '../state';
import { QrCode } from './qr-code';

/**
 * An invitation to a group, as a modal: a code for the other device's
 * camera, and the same link in a field to copy.
 *
 * A dialog because it's an errand that ends on someone else's screen.
 * The invitation outlives it: it's good for ten minutes, so closing this
 * to go and find the other device doesn't spoil the link.
 *
 * It puts itself away once a device it didn't know is in the group: the
 * errand is done, and the other screen is where to look next.
 */
export const InviteDialog = () => {
  const invite = useValue($invite);
  const closeInvite = useAction($inviteClosed);
  const feed = useValue($feed);

  /** The devices in the group when the invitation went up. */
  let before: Set<string> | null = null;

  createEffect(() => {
    const shown = invite();
    const current = feed();

    if (!shown) {
      before = null;
      return;
    }

    if (!current.loaded || current.groupId !== shown.groupId) return;

    const members = current.members.map((member) => member.id);
    if (!before) before = new Set(members);
    else if (members.some((id) => !before?.has(id))) closeInvite();
  });

  return (
    <Dialog
      testId="invite-dialog"
      open={invite() !== null}
      onOpenChange={() => closeInvite()}
      title="Link a device"
      description="Scan this with the other device, or open the link on it. It works once, for the next 10 minutes."
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
