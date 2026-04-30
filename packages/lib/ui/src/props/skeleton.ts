import { mergeProps } from 'solid-js';
import type { ArgTypes } from 'storybook-solidjs-vite';
import * as css from './skeleton.css';

export interface SkeletonProps {
  /** Render as a pulsing placeholder while data loads. @default false */
  skeleton?: boolean;
}

export const skeletonPropKeys = ['skeleton'] as const;

/** Class to apply when `skeleton` is true. */
export const resolveSkeletonClass = ({
  skeleton,
}: SkeletonProps): string | false | undefined => {
  return skeleton && css.skeleton;
};

interface SkeletonAttrs {
  'aria-hidden'?: true;
  inert?: true;
  tabindex?: -1;
}

/**
 * A11y attrs to apply while `skeleton` is true; an empty object
 * otherwise. Pair with Solid's `mergeProps` and a wrapping arrow so
 * the keys only appear in the spread while loading — without the
 * conditional, the spread would otherwise clear consumer-supplied
 * `aria-hidden` / `inert` on every non-skeleton render:
 *
 *   const merged = mergeProps(rest, () => resolveSkeletonAttrs(local));
 *   return <Dynamic ... {...merged} />;
 */
export const resolveSkeletonAttrs = ({
  skeleton,
}: SkeletonProps): SkeletonAttrs =>
  skeleton ? { 'aria-hidden': true, inert: true, tabindex: -1 } : {};

export const skeletonArgTypes: ArgTypes<SkeletonProps> = {
  skeleton: {
    control: 'boolean',
  },
};

/**
 * Default `args` for stories that opt in to the skeleton control.
 * Spread alongside the rest of `meta.args` so the boolean starts
 * off — otherwise the control renders unchecked but the prop is
 * undefined, which Storybook treats as a third indeterminate state.
 */
export const skeletonArgs = {
  skeleton: false,
} as const satisfies Required<SkeletonProps>;

/**
 * Bundled skeleton plumbing for components.
 *
 * Pair with a parent `splitProps(..., [...skeletonPropKeys, ...])`
 * so `skeleton` lives in the same `local` bag this helper reads.
 * Returns:
 * - `class`: a `() => string | false | undefined` accessor to drop
 *   into the component's class list before `local.class`.
 * - `rest`: a Solid-merged proxy of the rest props that adds
 *   `aria-hidden`, `inert`, and `tabindex={-1}` while skeleton is
 *   on. Spread it onto the host element instead of the raw `rest`.
 *
 * The rest proxy uses an arrow merge so the inert keys only appear
 * during skeleton renders — that way consumer-supplied
 * `aria-hidden` / `inert` / `tabindex` survive non-skeleton state.
 */
export const useSkeleton = <R extends object>(
  local: SkeletonProps,
  rest: R,
): { class: () => string | false | undefined; rest: R } => {
  const merged = mergeProps(rest, () => resolveSkeletonAttrs(local)) as R;
  return {
    class: () => resolveSkeletonClass(local),
    rest: merged,
  };
};
