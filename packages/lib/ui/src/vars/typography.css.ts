/**
 * Inheritable typography metrics shared across components.
 *
 * `<Text>` and `<Heading>` size variants assign these vars; the bases
 * read them via `fallbackVar(... , 'inherit')` so a `<Text as="span">`
 * with no `size` of its own picks up the nearest sized ancestor's
 * metrics. Components that need to align with surrounding text (e.g.
 * the radio's input box) read `lineHeight` directly so they track the
 * label they're nested in.
 */

import { createVar } from '@vanilla-extract/css';

/** Line-height of the nearest sized text ancestor. Inherits via the cascade. */
export const lineHeight = createVar();

/** Letter-spacing of the nearest sized text ancestor. Inherits via the cascade. */
export const letterSpacing = createVar();
