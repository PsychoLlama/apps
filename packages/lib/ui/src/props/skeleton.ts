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
