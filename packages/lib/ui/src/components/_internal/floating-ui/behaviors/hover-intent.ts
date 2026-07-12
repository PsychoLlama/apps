import { onCleanup } from 'solid-js';

/**
 * Hover intent for floating surfaces: debounced open and close so a
 * pointer passing through doesn't flash content, and a lingering close
 * so brief exits (crossing a gap toward the surface) don't slam it
 * shut. Paired with the grace-area math, this satisfies WCAG 1.4.13's
 * "hoverable" and "persistent" requirements — nothing here ever closes
 * on a timer while the pointer stays put.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/tooltip/src/tooltip.tsx
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/hover-card/src/hover-card.tsx
 *
 * Deviations from Radix:
 * - One utility for both components; Radix hand-rolls the timers in
 *   each. Tooltip's cross-trigger skip-delay window is provider state
 *   and lands with the Tooltip component, not here.
 */

/** Tuning for one hoverable surface. */
export interface HoverIntentOptions {
  /** Hover dwell before opening, in ms. */
  openDelay: number;
  /** Grace period after the pointer leaves before closing, in ms. */
  closeDelay: number;
  /** Flip the surface. Fires once per intent, never redundantly. */
  onOpenChange: (open: boolean) => void;
}

/** Pointer-side handle for a hoverable surface. */
export interface HoverIntent {
  /** The pointer entered the trigger (or the surface itself). */
  enter: () => void;
  /** The pointer left the trigger/surface. */
  leave: () => void;
  /** Open immediately, canceling any pending close — e.g. on focus. */
  open: () => void;
  /** Close immediately, canceling any pending open — e.g. on Escape. */
  close: () => void;
}

/**
 * Create the intent timers for one hoverable surface. Re-entering
 * during a pending close cancels it; leaving during a pending open
 * cancels that. Timers clean up with the owning component.
 */
export const createHoverIntent = (
  options: () => HoverIntentOptions,
): HoverIntent => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let open = false;

  const cancel = () => clearTimeout(timer);
  onCleanup(cancel);

  const setOpen = (next: boolean) => {
    cancel();
    if (open === next) return;

    open = next;
    options().onOpenChange(next);
  };

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),

    enter: () => {
      cancel();
      if (open) return;

      timer = setTimeout(() => setOpen(true), options().openDelay);
    },

    leave: () => {
      cancel();
      if (!open) return;

      timer = setTimeout(() => setOpen(false), options().closeDelay);
    },
  };
};
