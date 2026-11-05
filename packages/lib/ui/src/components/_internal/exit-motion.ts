/**
 * Recognize the motion a surface's close kicked off, so whatever
 * outlives the close — a mount, a visible window — can wait for it.
 *
 * The Web Animations API answers directly: whatever `getAnimations()`
 * reports on the element after closing that wasn't already running
 * while open was spawned by the close. Transitions count as much as
 * animations. Indefinite motion (infinite iteration counts) never
 * counts; there's nothing to wait for.
 *
 * Environments without WAAPI (jsdom) report no motion at all, which is
 * also the reduced-motion behavior: design tokens collapse durations
 * globally, so exits settle at once.
 */

/** Motion already running on an element, taken while it's open. */
export type OpenMotion = ReadonlySet<Animation>;

/** The element's running motion, or none where WAAPI doesn't exist. */
const motionOf = (element: HTMLElement): readonly Animation[] =>
  typeof element.getAnimations === 'function' ? element.getAnimations() : [];

/**
 * Note the motion running while open — the entrance, ambient loops.
 * Anything still in this set at close time wasn't spawned by closing,
 * so it can't be exit motion.
 */
export const snapshotOpenMotion = (element: HTMLElement): OpenMotion =>
  new Set(motionOf(element));

/**
 * The exit motion on a just-closed element, settled once every part of
 * it has ended — finished, cancelled mid-flight, or removed. `undefined`
 * when closing started none, so the caller can settle synchronously.
 *
 * Call after the closed state has rendered: `getAnimations` forces
 * style resolution, so motion the closed state triggers is visible by
 * then.
 */
export const settleExitMotion = (
  element: HTMLElement,
  openMotion: OpenMotion,
): Promise<unknown> | undefined => {
  const settling = motionOf(element).filter(
    (animation) =>
      !openMotion.has(animation) &&
      animation.effect?.getTiming().iterations !== Infinity,
  );

  if (settling.length === 0) return undefined;

  return Promise.allSettled(settling.map((animation) => animation.finished));
};
