import type { ArgTypes } from 'storybook-solidjs-vite';
import type { SpaceScale } from '#design';
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

export function resolveMarginClasses(
  margin: MarginProps,
): (string | false | undefined)[] {
  return [
    margin.m && css.m[margin.m],
    margin.mx && css.mx[margin.mx],
    margin.my && css.my[margin.my],
  ];
}

export const marginArgTypes: ArgTypes<MarginProps> = {
  m: spaceArgType,
  mx: spaceArgType,
  my: spaceArgType,
};
