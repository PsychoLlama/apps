import type { OnboardingProgress } from './onboarding';

/**
 * The screen the app should be showing, once the disk has answered.
 *
 * - `naming` — setup, step one: nobody has told this device what it's called.
 * - `pairing` — setup, step two: it has a name and has never met anyone.
 * - `session` — Beam proper.
 */
export type BeamSurface = 'naming' | 'pairing' | 'session';

/**
 * Which screen to show, from how far setting this device up has got. Thin on
 * purpose: setup is tracked rather than deduced, so this reads the step and
 * answers with a screen.
 */
export const surfaceOf = (onboarding: OnboardingProgress): BeamSurface =>
  onboarding.step === 'done' ? 'session' : onboarding.step;

/**
 * The screen to show, once where the reader is has been taken into account.
 *
 * One route overrides step two: a beam link. Opening one is how a device
 * meets another, and step two is the screen asking for exactly that — so
 * covering the link with it is the one thing that would make setup impossible
 * to finish. Both devices arrive at step two having met nobody, and whoever
 * scans has to be able to dial.
 *
 * Step one is not let through. A device that hasn't been named can still
 * dial, but it would land in the address book of whoever it met as an
 * unnamed stranger, and step one is there to prevent exactly that.
 */
export const surfaceForRoute = (
  surface: BeamSurface,
  pathname: string,
): BeamSurface =>
  surface === 'pairing' && pathname.startsWith('/share/') ? 'session' : surface;
