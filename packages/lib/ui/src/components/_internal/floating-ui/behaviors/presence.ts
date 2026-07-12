import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';

/**
 * Presence: keep a closing surface mounted until its CSS exit
 * animation finishes, so close transitions actually play. Motion comes
 * from `@lib/design` motion tokens in the consumer's stylesheet; this
 * only decides *when to unmount*.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/presence/src/presence.tsx
 *
 * Deviations from Radix:
 * - Animations only, not transitions — matching Radix, which also
 *   keys off `animation-name`. Exit motion should be an `animation`
 *   so it can run on an element that's about to leave.
 * - No `animationFillMode: 'forwards'` patching; author exit keyframes
 *   with a fill mode when the final frame matters. Reduced motion
 *   collapses durations globally via the design tokens, so the exit
 *   settles (and unmounts) immediately.
 */

/** Wiring for one animated surface. */
export interface PresenceConfig {
  /** The logical open state. */
  open: Accessor<boolean>;
  /**
   * The animated element, once mounted. Presence keeps reading it
   * while closing, so keep returning the element for as long as
   * {@link createPresence}'s `mounted` says to render it.
   */
  element: Accessor<HTMLElement | null | undefined>;
}

/**
 * Track whether a surface should be in the DOM: mounted while open,
 * and while an exit animation kicked off by closing is still running.
 * Render under `<Show when={mounted()}>`.
 *
 * Exit motion is detected the way Radix does it: the animation name is
 * captured while open, and closing counts as animated only when the
 * closed state resolves a *different* name — a lingering entrance
 * animation never holds the mount open.
 */
export const createPresence = (config: PresenceConfig): Accessor<boolean> => {
  const [mounted, setMounted] = createSignal(config.open());
  let openAnimation = 'none';

  createEffect(() => {
    const element = config.element();

    if (config.open()) {
      setMounted(true);
      openAnimation = element
        ? getComputedStyle(element).animationName
        : 'none';
      return;
    }

    if (!element) {
      setMounted(false);
      return;
    }

    const { animationName } = getComputedStyle(element);
    const exiting =
      animationName !== 'none' &&
      animationName !== '' &&
      animationName !== openAnimation;

    if (!exiting) {
      setMounted(false);
      return;
    }

    const settle = (event: AnimationEvent) => {
      if (event.target === element) setMounted(false);
    };

    element.addEventListener('animationend', settle);
    element.addEventListener('animationcancel', settle);

    onCleanup(() => {
      element.removeEventListener('animationend', settle);
      element.removeEventListener('animationcancel', settle);
    });
  });

  return mounted;
};
