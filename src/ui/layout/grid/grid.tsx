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
  /** Number of equal-width columns. */
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Number of equal-height rows. */
  rows?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Vertical alignment of grid items within their cells. */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Horizontal alignment of grid items within their cells. */
  justify?: 'start' | 'center' | 'end' | 'stretch';
  /** Uniform spacing between rows and columns. */
  gap?: SpaceScale;
  /** Horizontal spacing between columns. Overrides `gap` on the inline axis. */
  gapX?: SpaceScale;
  /** Vertical spacing between rows. Overrides `gap` on the block axis. */
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
