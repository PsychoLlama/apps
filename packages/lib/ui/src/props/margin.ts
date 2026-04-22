import type { ArgTypes } from 'storybook-solidjs-vite';
import type { SpaceScale } from '@lib/design';
import { spaceArgType } from './padding';
import * as css from './margin.css';

export interface MarginProps {
  /** Uniform margin on all sides. */
  m?: SpaceScale;
  /** Horizontal (inline) margin. */
  mx?: SpaceScale;
  /** Vertical (block) margin. */
  my?: SpaceScale;
}

export const marginPropKeys = ['m', 'mx', 'my'] as const;

export const resolveMarginClasses = (
  margin: MarginProps,
): (string | false | undefined)[] => {
  return [
    margin.m && css.margin[margin.m],
    margin.mx && css.marginX[margin.mx],
    margin.my && css.marginY[margin.my],
  ];
};

export const marginArgTypes: ArgTypes<MarginProps> = {
  m: spaceArgType,
  mx: spaceArgType,
  my: spaceArgType,
};
