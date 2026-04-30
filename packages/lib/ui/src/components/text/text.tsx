import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import type { TypeScale, FontWeight, TextColor } from '@lib/design';
import {
  type HtmlTextTag,
  type PolymorphicProps,
} from '../../props/polymorphic';
import {
  type MarginProps,
  marginPropKeys,
  resolveMarginClasses,
} from '../../props/margin';
import {
  type TrimProps,
  trimPropKeys,
  resolveTrimClass,
} from '../../props/trim';
import {
  type SelectableProps,
  selectablePropKeys,
  resolveSelectableClass,
} from '../../props/selectable';
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './text.css';

/** Text-specific props, independent of the rendered element. */
interface TextOwnProps {
  /** Visual size on a 1–9 scale. @default 3 */
  size?: TypeScale;
  /** Font weight. */
  weight?: FontWeight;
  /** Text alignment. */
  align?: 'left' | 'center' | 'right';
  /** Text color emphasis. High contrast for primary content, low for secondary. */
  color?: TextColor;
}

/** Text props for a specific element tag. */
export type TextProps<T extends HtmlTextTag> = PolymorphicProps<
  T,
  TextOwnProps &
    TrimProps &
    MarginProps &
    SelectableProps &
    SkeletonProps &
    TestIdProps
>;

/** General-purpose text component for body copy, labels, and inline text. */
function Text<const T extends HtmlTextTag>(props: TextProps<T>): JSX.Element;
function Text(
  rawProps: { as: HtmlTextTag } & TextOwnProps &
    TrimProps &
    MarginProps &
    SelectableProps &
    SkeletonProps &
    TestIdProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
  const props = mergeProps({ size: 3 as const }, rawProps);
  const [local, rest] = splitProps(props, [
    'as',
    'size',
    'weight',
    'align',
    'color',
    'class',
    'children',
    ...trimPropKeys,
    ...marginPropKeys,
    ...selectablePropKeys,
    ...skeletonPropKeys,
    ...testIdPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      css.base,
      css.size[local.size],
      local.weight && css.weight[local.weight],
      local.align && css.align[local.align],
      local.color && css.color[local.color],
      resolveTrimClass(local),
      resolveSelectableClass(local),
      skeletonClass(),
      ...resolveMarginClasses(local),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Dynamic
      component={local.as}
      class={className()}
      data-testid={local.testId}
      {...skeletonProps}
    >
      {local.children}
    </Dynamic>
  );
}

export default Text;
