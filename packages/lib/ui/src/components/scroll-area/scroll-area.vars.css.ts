/**
 * CSS custom properties consumers of `<ScrollArea>` can override to
 * adjust the scrollbar's outer margin per side, per orientation.
 *
 * Each var defaults to `space[1]` from the scrollbar's own style.
 * Setting one on any ancestor (e.g. `<TableRoot variant="ghost">`)
 * cascades through and overrides the default — useful when the
 * surface chrome doesn't need a scrollbar gutter.
 *
 * Mirrors Radix's `--scrollarea-scrollbar-{horizontal|vertical}-margin-{top|right|bottom|left}`
 * naming so anyone reading upstream docs can find the equivalent
 * here.
 */

import { createVar } from '@vanilla-extract/css';

export const horizontalScrollbarMarginTop = createVar();
export const horizontalScrollbarMarginRight = createVar();
export const horizontalScrollbarMarginBottom = createVar();
export const horizontalScrollbarMarginLeft = createVar();

export const verticalScrollbarMarginTop = createVar();
export const verticalScrollbarMarginRight = createVar();
export const verticalScrollbarMarginBottom = createVar();
export const verticalScrollbarMarginLeft = createVar();
