/**
 * Which of Beam's screens a device should be looking at.
 *
 * Thin on purpose: setting a device up is tracked rather than deduced, so
 * this reads the step and answers with a screen. It used to weigh up a key
 * and an address book to guess the same thing, and every signal it leaned on
 * meant something else as well.
 */

import { defineFormula } from '@lib/state';
import { onboardingStore } from '../onboarding';

/**
 * The screen `/beam/*` should be showing.
 *
 * - `unknown` — the disk hasn't answered yet, so no screen is the right one.
 *   Prerender and first paint land here.
 * - `naming` — setup, step one: nobody has told this device what it's called.
 * - `pairing` — setup, step two: it has a name and has never met anyone.
 * - `session` — Beam proper.
 */
export type BeamSurface = 'unknown' | 'naming' | 'pairing' | 'session';

/**
 * Which screen to show, from how far setting this device up has got.
 *
 * A failed read falls through to the session rather than to setup. It means
 * we don't know what's true of this device, and setup is a claim that we do —
 * walking someone through it on a guess would ask them to name a device their
 * contacts may already know. The session surface can at least say something
 * went wrong.
 */
export const beamSurfaceFormula = defineFormula(
  [onboardingStore],
  (onboarding): BeamSurface => {
    if (onboarding.status === 'initial') return 'unknown';
    if (onboarding.status === 'loading') return 'unknown';
    if (onboarding.status === 'failed') return 'session';

    return onboarding.step === 'done' ? 'session' : onboarding.step;
  },
);

/**
 * The screen to show, once where the reader is has been taken into account.
 *
 * One route overrides step two: a beam link. Opening one is how a device
 * meets another, and step two is the screen asking for exactly that — so
 * covering the link with it is the one thing that would make setup impossible
 * to finish. Both devices arrive at step two having met nobody, and whoever
 * scans has to be able to dial; two devices each holding their own code up
 * would wait on each other forever.
 *
 * Step one is not let through, and shouldn't be. A device that hasn't been
 * named can still dial — the key is minted on load — but it would land in the
 * address book of whoever it met as an unnamed stranger, and the one thing
 * step one is there to prevent is exactly that.
 */
export const surfaceForRoute = (
  surface: BeamSurface,
  pathname: string,
): BeamSurface =>
  surface === 'pairing' && pathname.startsWith('/beam/share/')
    ? 'session'
    : surface;
