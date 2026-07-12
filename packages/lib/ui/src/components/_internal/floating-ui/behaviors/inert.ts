import { createEffect, onCleanup, type Accessor } from 'solid-js';

/**
 * Modality via `inert`: while a scope is active, everything outside
 * the given layer is unreachable — pointer, keyboard, and assistive
 * tech alike.
 *
 * @see https://github.com/radix-ui/primitives — Radix composes
 * `aria-hidden` (via the `aria-hidden` package), `react-remove-scroll`,
 * and focus guards to fake modality around portaled content.
 *
 * Deviations from Radix:
 * - One mechanism instead of three. Because our layers live in the
 *   flow, walking from the layer to the root and marking each level's
 *   *siblings* `inert` covers exactly "everything else": `inert`
 *   blocks focus and pointer events and hides the subtree from
 *   assistive tech in one move.
 * - No body scroll lock. The page stays scrollable by design; the
 *   tether keeps the surface placed.
 */

/**
 * How many active scopes claimed each element. An element is released
 * only when the last claim drops, so overlapping scopes (a context
 * menu inside a modal popover) compose instead of fighting.
 */
const claims = new Map<Element, number>();

const claim = (element: Element) => {
  const count = claims.get(element) ?? 0;

  // Leave author-set inert alone entirely — it was there before any
  // scope claimed it, and it must survive after the last one leaves.
  if (count === 0 && element.hasAttribute('inert')) return;

  claims.set(element, count + 1);
  element.setAttribute('inert', '');
};

const release = (element: Element) => {
  const count = claims.get(element);
  if (count === undefined) return;

  if (count === 1) {
    claims.delete(element);
    element.removeAttribute('inert');
  } else {
    claims.set(element, count - 1);
  }
};

/**
 * While `layer` yields an element, everything outside that element's
 * ancestor chain is marked `inert`. Yield `null` to lift the scope.
 * Client-only by construction — the effect never runs during SSR.
 */
export const createInertScope = (layer: Accessor<HTMLElement | null>): void => {
  createEffect(() => {
    const active = layer();
    if (!active) return;

    const claimed: Element[] = [];

    // At every level from the layer to <body>, the layer's own chain
    // stays live and each sibling subtree goes inert.
    for (
      let node: Element = active;
      node.parentElement && node !== document.body;
      node = node.parentElement
    ) {
      for (const sibling of node.parentElement.children) {
        if (sibling === node) continue;

        claim(sibling);
        claimed.push(sibling);
      }
    }

    onCleanup(() => claimed.forEach(release));
  });
};
