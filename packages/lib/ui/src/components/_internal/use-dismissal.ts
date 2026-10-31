import { type Accessor } from 'solid-js';
import { useGlobalListener } from './use-global-listener';

/**
 * What closed the window. Escape is aimed at the window itself; an
 * outside press or focus has put the user somewhere else.
 */
export type DismissalReason = 'escape' | 'outside';

/** Inputs to {@link useDismissal}. */
export interface DismissalInputs {
  /** Whether the window is open. */
  open: Accessor<boolean>;

  /** The floating root, holding the trigger and the window. */
  root: Accessor<HTMLElement | undefined>;

  /** Asks the owner to close. */
  dismiss: (reason: DismissalReason) => void;
}

/** Listener options for the presses heard outside the window. */
const PASSIVE: AddEventListenerOptions = { passive: true };

/**
 * Closes an open floating window on Escape, a press outside it, or focus
 * moving outside it. "Outside" is outside the root, so the trigger
 * counts as inside: its own handler is what toggles.
 *
 * Attached only while open, so a page of closed windows listens for
 * nothing.
 */
export const useDismissal = (inputs: DismissalInputs): void => {
  const outside = (event: Event) => {
    const root = inputs.root();

    return (
      root !== undefined &&
      event.target instanceof Node &&
      !root.contains(event.target)
    );
  };

  const whileOpen = <Target>(target: Target) =>
    inputs.open() ? target : undefined;

  // Heard on `window`, the last stop on the way up, so anything nearer
  // the focus that claims the key first — a tooltip, a combobox — keeps
  // it. Once taken here it's cancelled, so a dialog around the window
  // doesn't close on the same press.
  useGlobalListener(
    () => whileOpen(window),
    'keydown',
    {},
    (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;

      event.preventDefault();
      inputs.dismiss('escape');
    },
  );

  // A touch that lands outside may be the start of a scroll, so it waits
  // for the click that confirms a tap. Every other pointer dismisses on
  // the press. Any new press drops a tap still waiting.
  let pendingTap = false;

  useGlobalListener(
    () => whileOpen(document),
    'pointerdown',
    PASSIVE,
    (event) => {
      pendingTap = false;
      if (!outside(event)) return;

      if (event.pointerType === 'touch') pendingTap = true;
      else inputs.dismiss('outside');
    },
  );

  useGlobalListener(
    () => whileOpen(document),
    'click',
    PASSIVE,
    (event) => {
      if (!pendingTap) return;

      pendingTap = false;
      if (outside(event)) inputs.dismiss('outside');
    },
  );

  // Tabbing away, or anything else that moves focus off the window and
  // its trigger.
  useGlobalListener(
    () => whileOpen(document),
    'focusin',
    PASSIVE,
    (event) => {
      if (outside(event)) inputs.dismiss('outside');
    },
  );
};
