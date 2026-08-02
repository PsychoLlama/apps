import { style } from '@vanilla-extract/css';

/**
 * The onboarding column proper — everything below the title. Held to a
 * comfortable reading width rather than the container's, which is sized for
 * the address book beside it: a single field and a single button stretched
 * across that measure read as a banner rather than as the one thing to do
 * next.
 */
export const step = style({
  width: '100%',
  maxWidth: '22rem',
});
