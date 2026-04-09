import { Dynamic } from 'solid-js/web';
import { splitProps } from 'solid-js';
import type { ParentComponent } from 'solid-js';
import {
  boxPropKeys,
  resolveBoxClasses,
  type BoxProps,
  type SpaceScale,
} from '../box/box';
import * as css from './grid.css';

export interface GridProps extends BoxProps {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  rows?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'stretch';
  gap?: SpaceScale;
  gapX?: SpaceScale;
  gapY?: SpaceScale;
}

const Grid: ParentComponent<GridProps> = (props) => {
  const [local, boxAndRest] = splitProps(props, [
    'columns',
    'rows',
    'align',
    'justify',
    'gap',
    'gapX',
    'gapY',
  ]);
  const [box, rest] = splitProps(boxAndRest, boxPropKeys);

  const className = () =>
    [
      ...resolveBoxClasses(box),
      css.base,
      local.columns && css.columns[local.columns],
      local.rows && css.rows[local.rows],
      local.align && css.align[local.align],
      local.justify && css.justify[local.justify],
      local.gap && css.gap[local.gap],
      local.gapX && css.gapX[local.gapX],
      local.gapY && css.gapY[local.gapY],
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

export default Grid;
