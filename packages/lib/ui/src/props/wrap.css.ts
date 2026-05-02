/**
 * Word-wrap utility — `text-wrap` strategy with a `white-space` reset.
 *
 * Mirrors Radix UI Themes' wrap utilities. `pretty` and `balance`
 * delegate to the modern `text-wrap` property; `wrap` and `nowrap`
 * provide explicit `white-space` control for callers that want to
 * override an ancestor's choice.
 *
 * @see https://github.com/radix-ui/themes (`rt-r-tw-*`, MIT)
 */
import { styleVariants } from '@vanilla-extract/css';

export const wrap = styleVariants({
  wrap: { whiteSpace: 'normal' },
  nowrap: { whiteSpace: 'nowrap' },
  pretty: { whiteSpace: 'normal', textWrap: 'pretty' },
  balance: { whiteSpace: 'normal', textWrap: 'balance' },
});
