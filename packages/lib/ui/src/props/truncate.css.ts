/**
 * Truncate utility — single-line text overflow with trailing ellipsis.
 *
 * @see https://github.com/radix-ui/themes (`rt-truncate`, MIT)
 *
 * Caveat (inherited from upstream): `text-overflow: ellipsis` only
 * applies to block containers, so this rule is a no-op on inline hosts
 * — `Link` (`<a>`), `<Text as="span">`, etc. Consumers needing to
 * truncate inline content must promote the element themselves
 * (`display: inline-block` plus a width constraint) or wrap it in a
 * block-level parent that owns the truncation.
 */
import { style } from '@vanilla-extract/css';

export const truncate = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
