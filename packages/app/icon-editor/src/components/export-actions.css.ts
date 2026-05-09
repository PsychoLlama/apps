import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';

/**
 * Footer row beneath the export button — surfaces the active pack's
 * license SPDX so the user sees what they're committing to. Quiet
 * styling so it reads as informational, not an action.
 */
export const licenseRow = style({
  paddingTop: space[1],
});
