import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import HeadingComponent, { type HeadingProps } from './heading';
import { marginArgTypes } from '../../props/margin';
import { trimArgTypes } from '../../props/trim';

const meta = {
  title: 'UI/Typography',
  component: HeadingComponent,
  args: {
    children: 'Sphinx of black quartz, judge my vow',
    as: 'h1',
    size: 6,
    weight: 'bold',
  },
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
    size: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    weight: {
      control: 'inline-radio',
      options: ['light', 'regular', 'medium', 'bold'],
    },
    align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
    },
    color: {
      control: 'inline-radio',
      options: ['highContrast', 'lowContrast'],
    },
    children: { control: 'text' },
    ...trimArgTypes,
    ...marginArgTypes,
  },
} satisfies Meta<HeadingProps<'h1'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Heading: Story = {};
