import {
  createRenderEffect,
  createEffect,
  onCleanup,
  type Accessor,
} from 'solid-js';

/**
 * Focus plumbing for floating surfaces: remembering where focus came
 * from, and (for modal surfaces) keeping it inside.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/focus-scope/src/focus-scope.tsx
 *
 * Deviations from Radix:
 * - No focus guards. Radix injects tabbable sentinels at the edges of
 *   `<body>` because portaled content can be the document's last
 *   element; in-flow surfaces sit next to their triggers, so the
 *   natural tab order already surrounds them.
 * - No MutationObserver re-trap. Surfaces unmount through presence
 *   handling rather than having their focused children ripped out.
 * - Restoration is explicit (a returned function) instead of implicit
 *   on unmount: whether focus returns to the trigger depends on *how*
 *   the surface closed (Escape restores; clicking elsewhere doesn't),
 *   and only the consumer knows.
 */

/** Focusables per WHATWG, minus the disabled/hidden ones we can query. */
const TABBABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** All keyboard-reachable descendants, in DOM order. */
const tabbablesOf = (container: HTMLElement): HTMLElement[] =>
  [...container.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) => !element.hasAttribute('inert'),
  );

/**
 * Remember the focused element on the rising edge of `active` and hand
 * back a restore function. Runs during render, before any focus moves
 * into the opening surface, so the memory is the *trigger*, not the
 * surface's first field.
 */
export const createFocusMemory = (active: Accessor<boolean>): (() => void) => {
  let previous: HTMLElement | null = null;
  let wasActive = false;

  createRenderEffect(() => {
    const nowActive = active();

    if (nowActive && !wasActive) {
      previous =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }

    wasActive = nowActive;
  });

  return () => {
    if (previous?.isConnected) previous.focus();
  };
};

/**
 * Trap keyboard focus inside a container while it yields one: Tab
 * wraps at the edges, and focus escaping by any other means is pulled
 * back in. For modal surfaces only — non-modal floating content must
 * stay in the natural tab order.
 */
export const createFocusTrap = (
  container: Accessor<HTMLElement | null>,
): void => {
  createEffect(() => {
    const active = container();
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const tabbables = tabbablesOf(active);
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];

      // Nothing tabbable: keep focus parked on the container itself.
      if (!first || !last) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && active.contains(event.target)) {
        return;
      }

      (tabbablesOf(active)[0] ?? active).focus();
    };

    active.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);

    onCleanup(() => {
      active.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    });
  });
};
