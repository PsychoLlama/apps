/**
 * Key resolution for roving-tabindex composites (menus, menubars,
 * toolbars): one tab stop, arrows move the highlight.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/roving-focus/src/roving-focus-group.tsx
 *
 * Deviations from Radix:
 * - Pure key→index math instead of a component. Consumers own their
 *   item elements and tabindex bookkeeping (see `tabs/trigger.tsx` for
 *   the in-repo wiring pattern); this just answers "where does this
 *   keystroke send the highlight?" so every consumer agrees on the
 *   keyboard model.
 * - No RTL handling yet; physical arrow keys map to physical
 *   directions. Revisit with the first RTL consumer.
 */

/** Orientation of the composite's primary movement axis. */
export type RovingOrientation = 'horizontal' | 'vertical';

/** Inputs for resolving one keystroke. */
export interface RovingKeyContext {
  /** Number of items in the composite. */
  count: number;
  /** Index of the currently highlighted item. */
  current: number;
  /** Movement axis. Cross-axis arrows are ignored. */
  orientation: RovingOrientation;
  /** Wrap from the last item to the first and back. Default `true`. */
  loop?: boolean;
}

const NEXT_KEYS: Record<RovingOrientation, string> = {
  horizontal: 'ArrowRight',
  vertical: 'ArrowDown',
};

const PREV_KEYS: Record<RovingOrientation, string> = {
  horizontal: 'ArrowLeft',
  vertical: 'ArrowUp',
};

/**
 * Resolve where a keystroke moves the roving highlight, or `null` for
 * keys the composite doesn't own (the caller should not preventDefault
 * those). Home/PageUp jump to the first item, End/PageDown to the
 * last, matching the APG composite pattern.
 */
export const rovingKeyTarget = (
  key: string,
  context: RovingKeyContext,
): number | null => {
  const { count, current, orientation, loop = true } = context;
  if (count === 0) return null;

  const last = count - 1;

  if (key === 'Home' || key === 'PageUp') return 0;
  if (key === 'End' || key === 'PageDown') return last;

  if (key === NEXT_KEYS[orientation]) {
    if (current < last) return current + 1;
    return loop ? 0 : current;
  }

  if (key === PREV_KEYS[orientation]) {
    if (current > 0) return current - 1;
    return loop ? last : current;
  }

  return null;
};
