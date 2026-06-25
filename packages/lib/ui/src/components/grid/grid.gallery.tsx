import { For } from 'solid-js';
import type { Listing } from '#gallery';
import Grid, { type GridProps } from './grid';
import * as css from './grid.gallery.css';

const CELLS = [1, 2, 3, 4, 5, 6];

/**
 * Gallery listing for `Grid`. Enumerates the container across its track and
 * spacing axes — column count and gap.
 */
export default {
  title: 'Grid',
  group: 'layout',
  render: (props) => (
    <Grid as="div" gap={2} {...props} class={css.container}>
      <For each={CELLS}>{(cell) => <span class={css.tile}>{cell}</span>}</For>
    </Grid>
  ),
  sections: [
    {
      title: 'Columns',
      align: { columns: 'center' },
      columns: [
        { title: '1', props: { columns: 1 } },
        { title: '2', props: { columns: 2 } },
        { title: '3', props: { columns: 3 } },
        { title: '4', props: { columns: 4 } },
      ],
    },
    {
      title: 'Gap',
      align: { columns: 'center' },
      columns: [
        { title: '1', props: { columns: 3, gap: 1 } },
        { title: '3', props: { columns: 3, gap: 3 } },
        { title: '5', props: { columns: 3, gap: 5 } },
      ],
    },
  ],
} satisfies Listing<GridProps<'div'>>;
