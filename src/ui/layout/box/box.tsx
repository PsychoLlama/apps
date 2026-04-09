import { Dynamic } from 'solid-js/web';
import { splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import type { space, radius, shadow, background } from '#design';
import * as css from './box.css';

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

export type SpaceScale = keyof typeof space;

export interface BoxProps extends JSX.HTMLAttributes<HTMLElement> {
  /** The HTML element to render. Use semantic elements where possible. */
  as: BoxElement;
  /** Uniform padding on all sides. */
  p?: SpaceScale;
  /** Horizontal (inline) padding. */
  px?: SpaceScale;
  /** Vertical (block) padding. */
  py?: SpaceScale;
  /** Surface background color from the design token palette. */
  background?: Exclude<keyof typeof background, 'overlay'>;
  /** Border radius from the design token scale. */
  radius?: keyof typeof radius;
  /** Box shadow elevation from the design token scale. */
  shadow?: keyof typeof shadow;
}

export const boxPropKeys = [
  'as',
  'p',
  'px',
  'py',
  'background',
  'radius',
  'shadow',
  'class',
  'children',
] as const;

/** Resolve Box surface/spacing props to CSS class names. */
export function resolveBoxClasses(
  props: Pick<BoxProps, 'p' | 'px' | 'py' | 'background' | 'radius' | 'shadow'>,
): (string | false | undefined)[] {
  return [
    props.p && css.p[props.p],
    props.px && css.px[props.px],
    props.py && css.py[props.py],
    props.background && css.bg[props.background],
    props.radius && css.r[props.radius],
    props.shadow && css.s[props.shadow],
  ];
}

/** Polymorphic surface primitive. Applies padding, background, radius, and shadow from design tokens. */
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
