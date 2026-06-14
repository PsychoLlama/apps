import type { RadiusScale, ShadowLevel, BackgroundColor } from '@lib/design';
import {
  paddingPropKeys,
  resolvePaddingClasses,
  type PaddingProps,
} from './padding';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from './margin';
import { skeletonPropKeys, type SkeletonProps } from './skeleton';
import { testIdPropKeys, type TestIdProps } from './test-id';
import * as css from './box.css';

/** Surface props shared across layout primitives. */
export interface BoxBaseProps
  extends PaddingProps, MarginProps, SkeletonProps, TestIdProps {
  /** Surface background color from the design token palette. */
  background?: Exclude<BackgroundColor, 'overlay'>;
  /** Border radius from the design token scale. */
  radius?: RadiusScale;
  /** Box shadow elevation from the design token scale. */
  shadow?: ShadowLevel;
}

export const boxPropKeys = [
  ...paddingPropKeys,
  ...marginPropKeys,
  ...skeletonPropKeys,
  ...testIdPropKeys,
  'as',
  'background',
  'radius',
  'shadow',
  'class',
  'children',
] as const;

/** Resolve surface/spacing props to CSS class names. */
export const resolveBoxClasses = (
  box: PaddingProps &
    MarginProps &
    Pick<BoxBaseProps, 'background' | 'radius' | 'shadow'>,
): (string | false | undefined)[] => {
  return [
    ...resolvePaddingClasses(box),
    ...resolveMarginClasses(box),
    box.background && css.bg[box.background],
    box.radius && css.radiusVariants[box.radius],
    box.shadow && css.shadowVariants[box.shadow],
  ];
};
