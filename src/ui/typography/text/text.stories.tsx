import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import TextComponent, { type TextProps } from './text';

const meta = {
  title: 'UI/Typography',
  component: TextComponent,
  args: {
    children: 'Sphinx of black quartz, judge my vow',
    as: 'span',
    size: 3,
  },
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['span', 'p', 'div', 'label'],
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
  },
} satisfies Meta<TextProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};
