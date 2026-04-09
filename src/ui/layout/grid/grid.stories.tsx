import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { type GridProps } from './grid';
import BoxComponent from '../box/box';
import GridComponent from './grid';
import { boxArgTypes } from '../box/box.stories';

const Swatch = () => (
  <BoxComponent as="div" p={3} background="panelSolid" radius={2}>
    Item
  </BoxComponent>
);

const meta = {
  title: 'UI/Layout',
  component: GridComponent,
  args: {
    as: 'div',
    columns: 3,
    gap: 3,
    children: (
      <>
        <Swatch />
        <Swatch />
        <Swatch />
        <Swatch />
        <Swatch />
        <Swatch />
      </>
    ),
  },
  argTypes: {
    ...boxArgTypes,
    columns: {
      control: { type: 'range', min: 1, max: 6, step: 1 },
    },
    rows: {
      control: { type: 'range', min: 1, max: 6, step: 1 },
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
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    gapX: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    gapY: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
  },
} satisfies Meta<GridProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};
