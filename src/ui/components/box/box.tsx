import { Dynamic } from 'solid-js/web';
import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import type { RadiusScale, ShadowLevel, BackgroundColor } from '#design';
import {
  paddingPropKeys,
  resolvePaddingClasses,
  type PaddingProps,
} from '../../props/padding';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  type HtmlBoxTag,
  type PolymorphicProps,
} from '../../props/polymorphic';
import * as css from './box.css';

/** Design token props shared across all Box element variants. */
export interface BoxBaseProps extends PaddingProps, MarginProps {
  /** Surface background color from the design token palette. */
  background?: Exclude<BackgroundColor, 'overlay'>;
  /** Border radius from the design token scale. */
  radius?: RadiusScale;
  /** Box shadow elevation from the design token scale. */
  shadow?: ShadowLevel;
}

/** Box props for a specific element tag. */
export type BoxProps<T extends HtmlBoxTag> = PolymorphicProps<T> & BoxBaseProps;

export const boxPropKeys = [
  ...paddingPropKeys,
  ...marginPropKeys,
  'as',
  'background',
  'radius',
  'shadow',
  'class',
  'children',
] as const;

/* eslint-disable solid/reactivity -- called from reactive contexts in components */
/** Resolve Box surface/spacing props to CSS class names. */
export function resolveBoxClasses(
  props: PaddingProps &
    MarginProps &
    Pick<BoxBaseProps, 'background' | 'radius' | 'shadow'>,
): (string | false | undefined)[] {
  return [
    ...resolvePaddingClasses(props),
    ...resolveMarginClasses(props),
    props.background && css.bg[props.background],
    props.radius && css.r[props.radius],
    props.shadow && css.s[props.shadow],
  ];
}
/* eslint-enable solid/reactivity */

/** Polymorphic surface primitive. Applies padding, margin, background, radius, and shadow from design tokens. */
function Box<const T extends HtmlBoxTag>(props: BoxProps<T>): JSX.Element;
function Box(
  props: { as: HtmlBoxTag } & BoxBaseProps & JSX.HTMLAttributes<HTMLElement>,
) {
  const [local, rest] = splitProps(props, boxPropKeys);

  const className = () =>
    [...resolveBoxClasses(local), local.class].filter(Boolean).join(' ');

  return (
    <Dynamic component={local.as} class={className()} {...rest}>
      {local.children}
    </Dynamic>
  );
}

export default Box;
