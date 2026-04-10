import type { ArgTypes } from 'storybook-solidjs-vite';
import type { SpaceScale } from '#design';
import { spaceArgType } from './padding';
import * as css from './flex.css';

export interface FlexProps {
  /** Main-axis direction of flex children. */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** Cross-axis alignment of flex children. */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Main-axis distribution of flex children. */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Whether flex children wrap onto multiple lines. */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  /** Spacing between flex children. */
  gap?: SpaceScale;
  /** When true, the container expands to fill available space (`flex-grow: 1`). */
  grow?: boolean;
}

export const flexPropKeys = [
  'direction',
  'align',
  'justify',
  'wrap',
  'gap',
  'grow',
] as const;

export function resolveFlexClasses(
  flex: FlexProps,
): (string | false | undefined)[] {
  return [
    css.base,
    flex.direction && css.direction[flex.direction],
    flex.align && css.align[flex.align],
    flex.justify && css.justify[flex.justify],
    flex.wrap && css.wrap[flex.wrap],
    flex.gap && css.gap[flex.gap],
    flex.grow && css.grow,
  ];
}

export const flexArgTypes: ArgTypes<FlexProps> = {
  direction: {
    control: 'inline-radio',
    options: ['row', 'column', 'row-reverse', 'column-reverse'],
  },
  align: {
    control: 'inline-radio',
    options: ['start', 'center', 'end', 'stretch', 'baseline'],
  },
  justify: {
    control: 'inline-radio',
    options: ['start', 'center', 'end', 'between'],
  },
  wrap: {
    control: 'inline-radio',
    options: ['nowrap', 'wrap', 'wrap-reverse'],
  },
  gap: spaceArgType,
  grow: {
    control: 'boolean',
  },
};
