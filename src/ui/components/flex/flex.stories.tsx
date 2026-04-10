import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { type FlexProps } from './flex';
import FlexComponent from './flex';
import { boxArgTypes } from '../box/box.stories';
import { swatches } from '../../storybook/swatch';

const meta = {
  title: 'UI/Layout',
  component: FlexComponent,
  args: {
    as: 'div',
    direction: 'row',
    gap: 3,
    children: swatches(6),
  },
  argTypes: {
    ...boxArgTypes,
    direction: {
      control: 'inline-radio',
      options: ['row', 'column', 'row-reverse', 'column-reverse'],
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
    },
    justify: {
      control: 'inline-radio',
      options: ['start', 'center', 'end', 'between'],
    },
    wrap: {
      control: 'inline-radio',
      options: ['nowrap', 'wrap', 'wrap-reverse'],
    },
    gap: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    grow: {
      control: 'boolean',
    },
  },
} satisfies Meta<FlexProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flex: Story = {};
