import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Grid, type GridProps } from '@lib/ui';
import { boxArgTypes } from '@lib/ui/props/box';
import { swatches } from '../../../../swatch';
import { gallery } from '../../../../gallery';

const COLUMNS = [1, 2, 3, 4, 5, 6] as const;
const GAPS = [1, 3, 5, 7] as const;
const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;
const JUSTIFIES = ['start', 'center', 'end', 'stretch'] as const;

const meta = {
  title: 'UI/Layout/Grid',
  component: Grid,
  args: {
    as: 'div',
    columns: 4,
    gap: 3,
    children: swatches(9),
  },
  argTypes: {
    ...boxArgTypes,
    columns: {
      control: { type: 'range', min: 1, max: 6, step: 1 },
    },
    rows: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end', 'stretch'],
    },
    justify: {
      control: 'inline-radio',
      options: ['start', 'center', 'end', 'stretch'],
    },
    gap: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    gapX: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    gapY: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    skeleton: { table: { disable: true } },
  },
} satisfies Meta<GridProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Columns',
      items: COLUMNS.map((columns) => (
        <Grid as="div" columns={columns} gap={2} style={{ width: '8rem' }}>
          {swatches(6)}
        </Grid>
      )),
    },
    {
      title: 'Gap',
      items: GAPS.map((gap) => (
        <Grid as="div" columns={2} gap={gap} style={{ width: '6rem' }}>
          {swatches(4)}
        </Grid>
      )),
    },
    {
      title: 'Align',
      items: ALIGNS.map((align) => (
        <Grid
          as="div"
          columns={2}
          align={align}
          gap={2}
          style={{ width: '6rem', height: '4rem' }}
        >
          {swatches(2)}
        </Grid>
      )),
    },
    {
      title: 'Justify',
      items: JUSTIFIES.map((justify) => (
        <Grid
          as="div"
          columns={2}
          justify={justify}
          gap={2}
          style={{ width: '8rem' }}
        >
          {swatches(2)}
        </Grid>
      )),
    },
  ],
});

export const Playground: Story = {};
