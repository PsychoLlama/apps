/**
 * Truncate utility — single-line text overflow with trailing ellipsis.
 *
 * @see https://github.com/radix-ui/themes (`rt-truncate`, MIT)
 *
 * Deviation from upstream:
 * - Forces `display: block` so the rule is functional on inline hosts
 *   (`Link`, `<Text as="span">`). Upstream's class is a no-op on inline
 *   elements because `text-overflow: ellipsis` only applies to block
 *   containers. The prop is opt-in, so the layout shift is intentional.
 */
import { style } from '@vanilla-extract/css';

export const truncate = style({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
