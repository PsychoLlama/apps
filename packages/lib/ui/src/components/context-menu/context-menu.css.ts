/**
 * ContextMenu styles. The menu itself is styled by the shared menu
 * stylesheet; this covers only the area that opens it.
 *
 * Deviations from Radix:
 * - The iOS callout is suppressed by a class rather than an inline
 *   style, and only while the menu is enabled, so a disabled area
 *   keeps the native one.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/context-menu/src/context-menu.tsx
 */

import { style } from '@vanilla-extract/css';

/**
 * The area that opens the menu. A long press opens ours, so iOS
 * mustn't open its own.
 */
export const trigger = style({
  WebkitTouchCallout: 'none',
});
