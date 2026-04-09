import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { marginArgTypes } from '../../props/margin';
import ButtonComponent, { type ButtonProps } from './button';

const meta = {
  title: 'UI/Components',
  component: ButtonComponent,
  args: {
    children: 'Button',
    size: 2,
    variant: 'solid',
    color: 'accent',
  },
  argTypes: {
    ...marginArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 4, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['solid', 'soft', 'outline', 'ghost'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger'],
    },
    disabled: {
      control: 'boolean',
    },
    children: { control: 'text' },
  },
} satisfies Meta<ButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {};
