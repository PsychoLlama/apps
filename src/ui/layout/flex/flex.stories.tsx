import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { type FlexProps } from './flex';
import BoxComponent from '../box/box';
import FlexComponent from './flex';
import { boxArgTypes } from '../box/box.stories';

const Swatch = () => (
  <BoxComponent as="div" p={3} background="panelSolid" radius={2}>
    Item
  </BoxComponent>
);

const meta = {
  title: 'UI/Layout',
  component: FlexComponent,
  args: {
    as: 'div',
    direction: 'row',
    gap: 3,
    children: (
      <>
        <Swatch />
        <Swatch />
        <Swatch />
      </>
    ),
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
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    grow: {
      control: 'boolean',
    },
  },
} satisfies Meta<FlexProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flex: Story = {};
