/**
 * Which of Beam's screens a device should be looking at.
 *
 * The question spans two features — this device's identity and its address
 * book — so it lives above both rather than inside either. It's a derivation
 * and nothing more: onboarding has no state of its own, and no flag anyone has
 * to remember to set. What you've got is what decides what you see.
 */

import { defineFormula } from '@lib/state';
import { contactsStore } from './contacts';
import { identityStore } from './session';

/**
 * The screen `/beam/*` should be showing.
 *
 * - `unknown` — the vault or the address book hasn't answered yet, so no
 *   screen is the right one. Prerender and first paint land here.
 * - `identity` — onboarding, step one: this device has no key.
 * - `pairing` — onboarding, step two: it has a key but has never met anyone.
 * - `session` — Beam proper.
 */
export type BeamSurface = 'unknown' | 'identity' | 'pairing' | 'session';

/**
 * Which screen to show, from what this device has: a key, and someone to use
 * it with.
 *
 * Onboarding ends at the first contact rather than at a "done" the reader
 * clicks, because meeting a device is the thing it was walking them towards —
 * a flow that had to be dismissed could be dismissed halfway.
 *
 * Both failures fall through to the session, and for the same reason: they
 * mean we don't know what's true of this device, and onboarding is a claim
 * that we do. Offering a fresh key to someone whose vault merely hiccuped
 * would write a second identity over a working one; offering to pair a device
 * whose address book wouldn't open would be doing it in front of contacts it
 * already has. The session surface can at least say something went wrong.
 */
export const beamSurfaceFormula = defineFormula(
  [identityStore, contactsStore],
  (self, book): BeamSurface => {
    if (self.status === 'pending') return 'unknown';
    if (self.status === 'absent') return 'identity';
    if (self.status === 'failed') return 'session';

    // The key is good. Whether this device has ever met anyone is the address
    // book's to say, and an empty book that hasn't loaded says nothing.
    if (book.status === 'initial' || book.status === 'loading') {
      return 'unknown';
    }

    if (book.status === 'failed') return 'session';

    return Object.keys(book.entries).length === 0 ? 'pairing' : 'session';
  },
);

/**
 * The screen to show, once where the reader is has been taken into account.
 *
 * One route overrides step two: a beam link. Opening one is how a device
 * meets another, and step two is the screen asking for exactly that — so
 * covering the link with it is the one thing that would make onboarding
 * impossible to finish. Both devices start with an empty address book, and
 * whoever scans has to be able to dial; two devices each holding their own
 * code up would wait on each other forever.
 *
 * Nothing else is let through, and nothing needs to be. A device on step two
 * already has a working key and a live relay connection, so the share view it
 * lands on is fully functional — and the dial it makes is what ends
 * onboarding on both sides a moment later.
 */
export const surfaceForRoute = (
  surface: BeamSurface,
  pathname: string,
): BeamSurface =>
  surface === 'pairing' && pathname.startsWith('/beam/share/')
    ? 'session'
    : surface;
