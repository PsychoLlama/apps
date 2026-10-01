import { createSignal, type Accessor } from 'solid-js';
import { useGlobalListener } from './use-global-listener';

/** Inputs to {@link useDismissal}. */
export interface DismissalInputs {
  /** Whether the stylesheet considers the tooltip open. */
  open: Accessor<boolean>;

  /** The floating root, holding the trigger and the window. */
  root: Accessor<HTMLElement | undefined>;

  /** The window, the one part of the root a press may land on freely. */
  subject: Accessor<HTMLElement | undefined>;
}

/** What {@link useDismissal} hands back. */
export interface Dismissal {
  /** Whether the open window has been vetoed. */
  dismissed: Accessor<boolean>;

  /**
   * Clear the veto. Called when the stylesheet stops wanting the window
   * open, so a dismissed tooltip comes back on the next focus, not
   * before.
   */
  clear: () => void;

  /** Listens on the root for the click that dismisses from the trigger. */
  onRootClick: (event: MouseEvent) => void;
}

/** Listener options for everything the tooltip attaches outside itself. */
const PASSIVE: AddEventListenerOptions = { passive: true };

/**
 * Scroll doesn't bubble, so it's heard on the way down instead. Any
 * element can scroll, and the one that matters is an ancestor.
 */
const PASSIVE_CAPTURE: AddEventListenerOptions = {
  passive: true,
  capture: true,
};

/**
 * The tooltip's veto on an open window: Escape, a press outside the
 * window, a click on the trigger, or a scroll that moves it. Everything
 * it attaches outside the tooltip is passive, and attached only while
 * the tooltip is open and not yet dismissed.
 */
export const useDismissal = (inputs: DismissalInputs): Dismissal => {
  const [dismissed, setDismissed] = createSignal(false);

  const outsideWindow = (event: Event) =>
    !(event.target instanceof Node && inputs.subject()?.contains(event.target));

  const scrollsRoot = (event: Event) => {
    const root = inputs.root();

    return (
      root !== undefined &&
      event.target instanceof Node &&
      event.target.contains(root)
    );
  };

  // Listened for only while open and not yet dismissed, so a page of
  // closed tooltips listens for nothing.
  const listening = () => inputs.open() && !dismissed();

  // Escape has no target to speak of: it's aimed at whatever is on
  // screen, and the tooltip is.
  useGlobalListener(
    () => (listening() ? document : undefined),
    'keydown',
    PASSIVE,
    (event) => {
      if (event.key === 'Escape') setDismissed(true);
    },
  );

  // A press anywhere but the tooltip itself. Most of these would close
  // it anyway by blurring the trigger; this one also covers the presses
  // that hold focus by preventing the default, and lands before the
  // blur either way.
  useGlobalListener(
    () => (listening() ? document : undefined),
    'pointerdown',
    PASSIVE,
    (event) => {
      if (outsideWindow(event)) setDismissed(true);
    },
  );

  // Anything scrolling the trigger out from under its window. Heard on
  // `window`, which sees the capture phase for every scroller on the
  // page.
  useGlobalListener(
    () => (listening() ? window : undefined),
    'scroll',
    PASSIVE_CAPTURE,
    (event) => {
      if (scrollsRoot(event)) setDismissed(true);
    },
  );

  // A click inside the root but outside the window is a click on the
  // trigger. A pointer's was preceded by a press that already
  // dismissed, so this is for the keyboard's: Enter and Space arrive as
  // a click on the focused element.
  const onRootClick = (event: MouseEvent) => {
    if (inputs.open() && outsideWindow(event)) setDismissed(true);
  };

  return {
    dismissed,
    clear: () => setDismissed(false),
    onRootClick,
  };
};
