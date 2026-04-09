import type { ArgTypes } from 'storybook-solidjs-vite';
import { space } from '#design';
import * as css from './padding.css';

export type SpaceScale = keyof typeof space;

const spaceScaleOptions = Object.keys(space).map(Number);

export const spaceArgType = {
  control: 'select' as const,
  options: spaceScaleOptions,
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

export function resolvePaddingClasses(
  props: PaddingProps,
): (string | false | undefined)[] {
  return [
    props.p && css.p[props.p],
    props.px && css.px[props.px],
    props.py && css.py[props.py],
  ];
}

export const paddingArgTypes: ArgTypes<PaddingProps> = {
  p: spaceArgType,
  px: spaceArgType,
  py: spaceArgType,
};
