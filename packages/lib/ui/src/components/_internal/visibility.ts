import {
  createEffect,
  createSignal,
  onCleanup,
  untrack,
  type Accessor,
} from 'solid-js';
import {
  settleExitMotion,
  snapshotOpenMotion,
  type OpenMotion,
} from './exit-motion';

/**
 * Visibility: track whether a surface that never unmounts is on screen,
 * holding it visible until its CSS exit motion settles.
 *
 * The resident counterpart to `createPresence`. Presence decides when a
 * surface leaves the DOM; this decides when a surface that stays in the
 * DOM stops being seen, for owners that keep work running only while it
 * is — a tether measuring the page, say. Both wait on the same exit
 * motion, recognized by `exit-motion`.
 *
 * The surface's state rides out as `data-state`, with a third value
 * presence doesn't need: absent, for a surface at rest. The stylesheet
 * hides it there. A surface that has never opened is at rest from the
 * first render, so nothing keyed off `"closed"` — an exit animation —
 * plays on page load, and an exit that settles returns it to rest.
 */

/** Wiring for one resident surface. */
export interface VisibilityConfig {
  /** The logical open state. */
  open: Accessor<boolean>;

  /** The animated element, once rendered. */
  element: Accessor<HTMLElement | null | undefined>;
}

/** The surface's state, as `data-state` carries it. */
export type VisibilityState = 'open' | 'closed' | undefined;

/** What visibility hands back to the consumer. */
export interface Visibility {
  /**
   * Whether the surface is on screen: `true` while open, and while exit
   * motion kicked off by closing is still running.
   */
  visible: Accessor<boolean>;

  /**
   * Spread onto the animated element. `data-state` is `"open"` while
   * open, `"closed"` while the exit plays, and absent at rest — which
   * the stylesheet must hide.
   */
  props: { readonly 'data-state': VisibilityState };
}

/**
 * Track whether a resident surface is on screen, holding it visible
 * while the close's exit motion settles.
 */
export const createVisibility = (config: VisibilityConfig): Visibility => {
  const [visible, setVisible] = createSignal(config.open());

  let openMotion: OpenMotion = new Set();

  createEffect(() => {
    const element = config.element();

    if (config.open()) {
      setVisible(true);
      openMotion = element ? snapshotOpenMotion(element) : new Set();
      return;
    }

    // Already at rest: never opened, or settled since. Nothing played.
    if (!untrack(visible) || !element) {
      setVisible(false);
      return;
    }

    const settled = settleExitMotion(element, openMotion);

    if (!settled) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    // Reopening flips `cancelled` before the exit settles.
    void settled.then(() => {
      if (!cancelled) setVisible(false);
    });
  });

  return {
    visible,
    props: {
      get 'data-state'(): VisibilityState {
        if (config.open()) return 'open';
        return visible() ? 'closed' : undefined;
      },
    },
  };
};
