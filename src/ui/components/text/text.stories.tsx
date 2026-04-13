import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import TextComponent, { type TextProps } from './text';
import { marginArgTypes } from '../../props/margin';
import { trimArgTypes } from '../../props/trim';
import { selectableArgTypes } from '../../props/selectable';

const meta = {
  title: 'UI/Typography',
  component: TextComponent,
  args: {
    children: 'Sphinx of black quartz, judge my vow',
    as: 'p',
    size: 3,
  },
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['p', 'span', 'label', 'blockquote'],
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
    ...selectableArgTypes,
  },
} satisfies Meta<TextProps<'p'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};
