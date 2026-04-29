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

/**
 * Reactive a11y attrs to apply when `skeleton` is true. Returns an
 * object with getters so spreading (`{...resolveSkeletonAttrs(...)}`)
 * stays reactive in Solid JSX.
 */
export const resolveSkeletonAttrs = (skeleton: () => boolean | undefined) => ({
  get 'aria-hidden'(): true | undefined {
    return skeleton() ? true : undefined;
  },
  get inert(): true | undefined {
    return skeleton() ? true : undefined;
  },
  get tabindex(): -1 | undefined {
    return skeleton() ? -1 : undefined;
  },
});

export const skeletonArgTypes: ArgTypes<SkeletonProps> = {
  skeleton: {
    control: 'boolean',
  },
};
