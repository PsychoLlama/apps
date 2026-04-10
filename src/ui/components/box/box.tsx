import { Dynamic } from 'solid-js/web';
import { splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import type { radius, shadow, background } from '#design';
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
import * as css from './box.css';

export type { SpaceScale } from '../../props/padding';

export type BoxElement =
  | 'div'
  | 'span'
  | 'nav'
  | 'main'
  | 'section'
  | 'aside'
  | 'header'
  | 'footer'
  | 'article'
  | 'figure'
  | 'figcaption'
  | 'details'
  | 'summary'
  | 'fieldset'
  | 'form'
  | 'ol'
  | 'ul'
  | 'li';

export interface BoxProps
  extends PaddingProps, MarginProps, JSX.HTMLAttributes<HTMLElement> {
  /** The HTML element to render. Use semantic elements where possible. */
  as: BoxElement;
  /** Surface background color from the design token palette. */
  background?: Exclude<keyof typeof background, 'overlay'>;
  /** Border radius from the design token scale. */
  radius?: keyof typeof radius;
  /** Box shadow elevation from the design token scale. */
  shadow?: keyof typeof shadow;
}

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

/** Resolve Box surface/spacing props to CSS class names. */
export function resolveBoxClasses(
  props: PaddingProps &
    MarginProps &
    Pick<BoxProps, 'background' | 'radius' | 'shadow'>,
): (string | false | undefined)[] {
  return [
    ...resolvePaddingClasses(props),
    ...resolveMarginClasses(props),
    props.background && css.bg[props.background],
    props.radius && css.r[props.radius],
    props.shadow && css.s[props.shadow],
  ];
}

/** Polymorphic surface primitive. Applies padding, margin, background, radius, and shadow from design tokens. */
const Box: ParentComponent<BoxProps> = (props) => {
  const [local, rest] = splitProps(props, boxPropKeys);

  const className = () =>
    [...resolveBoxClasses(local), local.class].filter(Boolean).join(' ');

  return (
    <Dynamic component={local.as} class={className()} {...rest}>
      {local.children}
    </Dynamic>
  );
};

export default Box;
