import type { SpaceScale } from '@lib/design';
import * as css from './padding.css';

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
