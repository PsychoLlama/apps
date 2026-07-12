import { createEffect, onCleanup, type Accessor } from 'solid-js';

/**
 * Light-dismiss for layered floating surfaces — Escape and interaction
 * outside the layer.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/dismissable-layer/src/dismissable-layer.tsx
 *
 * Deviations from Radix:
 * - No `pointer-events: none` body lock and no layer "branches".
 *   Radix needs both because portaled content is DOM-detached from its
 *   logical parent; our layers nest in the flow, so plain
 *   `Node.contains` answers "is this interaction inside?" — a click in
 *   a submenu is inside the parent menu's subtree and never dismisses
 *   it by accident.
 * - The module-level stack only arbitrates Escape (topmost layer
 *   wins). Outside-pointer checks are per-layer containment.
 */

/** Why a layer was asked to dismiss. */
export type DismissReason = 'escape' | 'pointer-outside' | 'focus-outside';

/** A live dismiss layer; `null` deactivates it. */
export interface DismissConfig {
  /**
   * Elements that count as "inside" — typically the floating surface
   * and its trigger. Interactions within any of them never dismiss.
   */
  inside: readonly HTMLElement[];
  /** Called when the user asks the layer to go away. */
  onDismiss: (reason: DismissReason) => void;
  /** Dismiss on Escape. Only the topmost layer reacts. Default `true`. */
  escape?: boolean;
  /** Dismiss on pointer-down outside the layer. Default `true`. */
  pointerDownOutside?: boolean;
  /** Dismiss when focus lands outside the layer. Default `false` —
   * only components that trap or follow focus want this. */
  focusOutside?: boolean;
}

/**
 * The layer stack, shared across every live dismiss layer so nested
 * surfaces (a submenu over a menu over a popover) unwind
 * innermost-first: Escape only ever reaches the top of the stack.
 */
const layers: object[] = [];

/**
 * Register a dismiss layer while `config` yields one. Listeners hang
 * off `document`, so this is client-only by construction (the effect
 * never runs during SSR).
 */
export const createDismiss = (config: Accessor<DismissConfig | null>): void => {
  createEffect(() => {
    const current = config();
    if (!current) return;

    const layer = {};
    layers.push(layer);

    const isInside = (target: EventTarget | null) =>
      target instanceof Node &&
      current.inside.some((element) => element.contains(target));

    const onKeyDown = (event: KeyboardEvent) => {
      if (current.escape === false) return;
      if (event.key !== 'Escape') return;
      if (layers[layers.length - 1] !== layer) return;

      event.preventDefault();
      current.onDismiss('escape');
    };

    const onPointerDown = (event: PointerEvent) => {
      if (current.pointerDownOutside === false) return;
      if (isInside(event.target)) return;

      current.onDismiss('pointer-outside');
    };

    const onFocusIn = (event: FocusEvent) => {
      if (current.focusOutside !== true) return;
      if (isInside(event.target)) return;

      current.onDismiss('focus-outside');
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);

    onCleanup(() => {
      layers.splice(layers.indexOf(layer), 1);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    });
  });
};
