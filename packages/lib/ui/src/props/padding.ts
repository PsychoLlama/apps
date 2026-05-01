import type { ArgTypes } from 'storybook-solidjs-vite';
import type { SpaceScale } from '@lib/design';
import { space } from '@lib/design';
import * as css from './padding.css';

const spaceScaleOptions = Object.keys(space).map(Number);

// Storybook's args merge drops `undefined`, so a bare `undefined` option
// can't restore the default once a value is picked. Route through a
// string sentinel and `mapping` so the arg actually updates.
export const spaceArgType = {
  control: 'select' as const,
  options: ['none', ...spaceScaleOptions],
  mapping: { none: undefined } as Record<string, unknown>,
};

export interface PaddingProps {
  /** Uniform padding on all sides. */
  p?: SpaceScale;
  /** Horizontal (inline) padding. */
  px?: SpaceScale;
  /** Vertical (block) padding. */
  py?: SpaceScale;
}

export const paddingPropKeys = ['p', 'px', 'py'] as const;

export const resolvePaddingClasses = (
  padding: PaddingProps,
): (string | false | undefined)[] => {
  return [
    padding.p && css.padding[padding.p],
    padding.px && css.paddingX[padding.px],
    padding.py && css.paddingY[padding.py],
  ];
};

export const paddingArgTypes: ArgTypes<PaddingProps> = {
  p: spaceArgType,
  px: spaceArgType,
  py: spaceArgType,
};
