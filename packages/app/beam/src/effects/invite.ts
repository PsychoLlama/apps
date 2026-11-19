import { collect, pipe } from '@lib/effects';
import { toError } from '@lib/observability';
import type { DeviceConnection } from '../platform/device';
import { encodeQr } from '../platform/qr-code';
import { $invite, $inviteClosed, $inviteOpened, inviteLink } from '../state';
import { $openDevice } from './device';

/**
 * Make an invitation to a group and show it. The other device has to use
 * it while this one is online; it lets one device in, once.
 */
export const $openInvite = collect(
  [$openDevice, $inviteOpened],
  (connection, inviteOpened) => async (groupId: string) => {
    const code = await connection.invite(groupId);
    const link = inviteLink(window.location.origin, code);

    inviteOpened({ groupId, code, link, grid: await encodeQr(link) });
  },
);

/**
 * Put the invitation away and take it back. A code that was photographed
 * and never used shouldn't keep working.
 */
export const $closeInvite = collect(
  [$openDevice, $invite, $inviteClosed],
  (connection, invite, inviteClosed) => () => {
    const shown = invite();
    if (shown) connection.cancelInvite(shown.code);

    inviteClosed();
  },
);

/** How using an invitation went. */
export type JoinResult =
  { readonly groupId: string } | { readonly reason: string };

/**
 * Use another device's invitation. Resolves either way: an invitation that
 * has expired is an answer to show, not a failure of the page.
 */
export const $joinGroup = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (code: string): Promise<JoinResult> => {
      try {
        return { groupId: await connection.join(code) };
      } catch (error) {
        return { reason: toError(error).message };
      }
    },
]);
