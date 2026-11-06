/**
 * Stacking layer tokens. The only sanctioned `z-index` values in the
 * codebase.
 *
 * DO NOT USE WITHOUT EXPLICIT APPROVAL. `z-index` is a cancer. It must be
 * quarantined and eliminated, never grown.
 *
 * Floating windows can't reach the native top layer: they position with
 * CSS alone so they work without JavaScript, and that rules out
 * `popover` without anchor positioning. Without a layer, a window loses
 * to any positioned sibling that follows it in DOM order.
 *
 * Each layer is a CSS var that's never assigned, read through a
 * fallback. Native top-layer elements (`<dialog>`) still win over every
 * layer here.
 *
 * Don't add layers. Every new value has to be ordered against every
 * existing one, and that audit only grows.
 */
import { createVar, fallbackVar } from '@vanilla-extract/css';

const floating = createVar();

export const layer = {
  /**
   * Floating windows: tooltips, menus, popovers, hover cards. Apply to
   * the positioned window, not to anything inside it — the window is its
   * own stacking context, so a value below it only competes within it.
   */
  floating: fallbackVar(floating, '10'),
} as const;
