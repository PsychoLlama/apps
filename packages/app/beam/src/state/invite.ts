import { defineCell, defineCommand } from '@lib/state';

/**
 * A QR code as its raw module grid: no pixels, just which cells are dark,
 * so the view paints it with its own tokens.
 */
export interface QrGrid {
  /** Modules per side, quiet zone included. The grid is `size × size`. */
  size: number;

  /** Row-major grid, one byte per module: 1 = dark, 0 = light. */
  modules: Uint8Array;
}

/** An invitation this device is showing, for one other device to use. */
export interface Invite {
  /** The group it lets a device into. */
  groupId: string;

  /** The invitation itself, as the worker minted it. Kept to cancel it. */
  code: string;

  /** The link to open on the other device. Carries the code. */
  link: string;

  /** The link as a QR code, or `null` if it couldn't be drawn. */
  grid: QrGrid | null;
}

/** The invitation on screen, or `null` when none is. */
export const $invite = defineCell<Invite | null>(() => null);

/** An invitation was made and is being shown. */
export const $inviteOpened = defineCommand(
  [$invite],
  ([, setInvite]) =>
    (invite: Invite) => {
      setInvite(invite);
    },
);

/** The invitation was put away. */
export const $inviteClosed = defineCommand([$invite], ([, setInvite]) => () => {
  setInvite(null);
});

/** An invitation code: the inviter's key and a secret, as hex. */
const INVITE_CODE = /^[0-9a-f]{96}$/;

/**
 * The link that carries an invitation to another device.
 *
 * The code rides in the fragment, which browsers don't send to servers:
 * it's a secret, and the only parties with any business reading it are the
 * two devices.
 *
 * The trailing slash is where the prerendered page is served. Without it
 * the link costs a redirect first.
 */
export const inviteLink = (origin: string, code: string): string =>
  `${origin}/join/#${code}`;

/** The invitation code a link's fragment carries, or `null` if none. */
export const inviteCodeOf = (hash: string): string | null => {
  const code = hash.replace(/^#/, '');
  return INVITE_CODE.test(code) ? code : null;
};
