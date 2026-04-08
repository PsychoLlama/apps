import { Dynamic } from 'solid-js/web';
import { splitProps } from 'solid-js';
import type { ParentComponent } from 'solid-js';
import {
  boxPropKeys,
  resolveBoxClasses,
  type BoxProps,
  type SpaceScale,
} from '../box/box';
import * as css from './flex.css';

export interface FlexProps extends BoxProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: SpaceScale;
}

const Flex: ParentComponent<FlexProps> = (props) => {
  const [local, boxAndRest] = splitProps(props, [
    'direction',
    'align',
    'justify',
    'wrap',
    'gap',
  ]);
  const [box, rest] = splitProps(boxAndRest, boxPropKeys);

  const className = () =>
    [
      ...resolveBoxClasses(box),
      css.base,
      local.direction && css.direction[local.direction],
      local.align && css.align[local.align],
      local.justify && css.justify[local.justify],
      local.wrap && css.wrap[local.wrap],
      local.gap && css.gap[local.gap],
      box.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Dynamic component={box.as} class={className()} {...rest}>
      {box.children}
    </Dynamic>
  );
};

export default Flex;
