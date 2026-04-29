import type { ArgTypes } from 'storybook-solidjs-vite';
import type { RadiusScale, ShadowLevel, BackgroundColor } from '@lib/design';
import {
  paddingPropKeys,
  resolvePaddingClasses,
  paddingArgTypes,
  type PaddingProps,
} from './padding';
import {
  marginPropKeys,
  resolveMarginClasses,
  marginArgTypes,
  type MarginProps,
} from './margin';
import {
  skeletonPropKeys,
  skeletonArgTypes,
  type SkeletonProps,
} from './skeleton';
import { testIdPropKeys, testIdArgTypes, type TestIdProps } from './test-id';
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

export const boxArgTypes: ArgTypes<BoxBaseProps> = {
  ...paddingArgTypes,
  ...marginArgTypes,
  ...skeletonArgTypes,
  ...testIdArgTypes,
  background: {
    control: 'inline-radio' as const,
    options: ['page', 'panelSolid', 'panelTranslucent', 'surface'],
  },
  radius: {
    control: 'select' as const,
    options: [1, 2, 3, 4, 5, 6, 'full'],
  },
  shadow: {
    control: 'select' as const,
    options: [1, 2, 3, 4, 5, 6],
  },
};
