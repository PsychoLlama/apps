import { collect, pipe } from '@lib/effects';
import { toError } from '@lib/observability';
import type { DeviceConnection } from '../platform/device';
import { encodeQr } from '../platform/qr-code';
import { $inviteOpened, inviteLink } from '../state';
import { $openDevice } from './device';

/**
 * Make an invitation to a group and show it. It lets one device in,
 * once, in the next ten minutes, while this device stays open.
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
 * What the device rejects a join with when it first had to leave a group
 * the invitation's group replaced. It's out, and the invitation is
 * unspent.
 */
const LEFT_BEHIND = 'left-behind';

/**
 * How using an invitation went. `restart` means the device had to leave
 * an older group first, and has: the invitation still works, from a
 * device opened afresh.
 */
export type JoinResult =
  | { readonly groupId: string }
  | { readonly reason: string }
  | { readonly restart: true };

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
        const reason = toError(error).message;
        return reason === LEFT_BEHIND ? { restart: true } : { reason };
      }
    },
]);
