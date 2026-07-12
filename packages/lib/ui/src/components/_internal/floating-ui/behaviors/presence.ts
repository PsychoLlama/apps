import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';

/**
 * Presence: keep a closing surface mounted until its CSS exit motion
 * finishes, so close transitions actually play. Motion comes from
 * `@lib/design` motion tokens in the consumer's stylesheet; this only
 * decides *when to unmount*.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/presence/src/presence.tsx
 *
 * Deviations from Radix:
 * - No style sniffing and no DOM writes. Radix reads
 *   `getComputedStyle().animationName` and diffs names to recognize
 *   exit motion; here the Web Animations API answers directly:
 *   whatever `getAnimations()` reports on the element *after* closing
 *   that wasn't already running *while open* was spawned by the close,
 *   and its `finished` promise is the unmount signal.
 * - The surface's open/closed state rides out as returned props
 *   (`data-state`) for the consumer to spread, rather than the
 *   consumer wiring its own attribute for the stylesheet to key off.
 * - Transitions hold the mount too, not just animations — the WAAPI
 *   view covers both.
 * - Indefinite motion (infinite iteration counts) never holds the
 *   mount; there's nothing to wait for.
 * - Environments without WAAPI (jsdom) unmount immediately, which is
 *   also the reduced-motion behavior: design tokens collapse durations
 *   globally, so exits settle at once.
 */

/** Wiring for one animated surface. */
export interface PresenceConfig {
  /** The logical open state. */
  open: Accessor<boolean>;
  /**
   * The animated element, once mounted. Presence keeps reading it
   * while closing, so keep returning the element for as long as
   * {@link Presence.mounted} says to render it.
   */
  element: Accessor<HTMLElement | null | undefined>;
}

/** What presence hands back to the consumer. */
export interface Presence {
  /**
   * Whether the surface should be in the DOM: `true` while open, and
   * while exit motion kicked off by closing is still running. Render
   * under `<Show when={mounted()}>`.
   */
  mounted: Accessor<boolean>;
  /**
   * Spread onto the animated element. Carries `data-state`
   * (`"open"`/`"closed"`), the attribute exit motion should key off.
   */
  props: { readonly 'data-state': 'open' | 'closed' };
}

/** The element's running motion, or none where WAAPI doesn't exist. */
const motionOf = (element: HTMLElement): readonly Animation[] =>
  typeof element.getAnimations === 'function' ? element.getAnimations() : [];

/**
 * Track whether a surface should be in the DOM, holding the mount
 * open while the close's exit motion settles.
 */
export const createPresence = (config: PresenceConfig): Presence => {
  const [mounted, setMounted] = createSignal(config.open());

  // Motion running while open — the entrance, ambient loops. Anything
  // still in this set at close time wasn't spawned by closing, so it
  // can't be exit motion.
  let openMotion: ReadonlySet<Animation> = new Set();

  createEffect(() => {
    const element = config.element();

    if (config.open()) {
      setMounted(true);
      openMotion = new Set(element ? motionOf(element) : []);
      return;
    }

    if (!element) {
      setMounted(false);
      return;
    }

    // The `data-state` flip has rendered by the time effects run, and
    // `getAnimations` forces style resolution, so motion the closed
    // state triggers is already visible here.
    const settling = motionOf(element).filter(
      (animation) =>
        !openMotion.has(animation) &&
        animation.effect?.getTiming().iterations !== Infinity,
    );

    if (settling.length === 0) {
      setMounted(false);
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    // Settled covers every ending: finished, canceled mid-flight, or
    // removed — reopening flips `cancelled` first either way.
    void Promise.allSettled(
      settling.map((animation) => animation.finished),
    ).then(() => {
      if (!cancelled) setMounted(false);
    });
  });

  return {
    mounted,
    props: {
      get 'data-state'() {
        return config.open() ? ('open' as const) : ('closed' as const);
      },
    },
  };
};
