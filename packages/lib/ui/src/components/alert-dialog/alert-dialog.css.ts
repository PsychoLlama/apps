/**
 * Alert Dialog styles.
 *
 * Upstream ships no stylesheet of its own — Radix Themes' Alert Dialog
 * imports the same `base-dialog.css` as Dialog and differs only in
 * behavior. Ours does the same by rendering a `Dialog`, so all that's
 * left here is the gap above the action row.
 *
 * Deviations from Radix:
 * - The gap is the component's, not the call site's. Upstream leaves
 *   the buttons to the consumer, whose examples all reach for
 *   `<Flex gap="3" mt="4" justify="end">`; our API renders them, so it
 *   owns the spacing.
 *
 * @see https://www.radix-ui.com/themes/docs/components/alert-dialog
 */

import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';

/**
 * Optional body content between the description and the actions. The
 * margin rides here rather than on the action row because the
 * description already clears its own space when it's the last thing
 * above the buttons.
 */
export const body = style({
  marginBlockEnd: space[4],
});
