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
  as: BoxElement;
  p?: SpaceScale;
  px?: SpaceScale;
  py?: SpaceScale;
  background?: Exclude<keyof typeof background, 'overlay'>;
  radius?: keyof typeof radius;
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
