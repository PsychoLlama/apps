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

const Flex: ParentComponent<FlexProps> = (props) => {
  const [local, boxAndRest] = splitProps(props, [
    'direction',
    'align',
    'justify',
    'wrap',
    'gap',
    'grow',
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
      local.grow && css.grow,
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
