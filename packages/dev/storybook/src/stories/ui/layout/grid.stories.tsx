import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Grid as GridComponent, type GridProps } from '@lib/ui';
import { boxArgTypes } from '@lib/ui/props/box';
import { skeletonArgs } from '@lib/ui/props/skeleton';
import { swatches } from '../../../swatch';

const meta = {
  title: 'UI/Layout',
  component: GridComponent,
  args: {
    as: 'div',
    columns: 4,
    gap: 3,
    children: swatches(9),
    ...skeletonArgs,
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
  },
} satisfies Meta<GridProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};
