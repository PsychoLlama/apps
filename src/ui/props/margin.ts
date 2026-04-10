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
  props: MarginProps,
): (string | false | undefined)[] {
  return [
    props.m && css.m[props.m],
    props.mx && css.mx[props.mx],
    props.my && css.my[props.my],
  ];
}

export const marginArgTypes: ArgTypes<MarginProps> = {
  m: spaceArgType,
  mx: spaceArgType,
  my: spaceArgType,
};
