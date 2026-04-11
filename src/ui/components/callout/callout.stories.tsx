import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { marginArgTypes } from '../../props/margin';
import CalloutComponent, { type CalloutProps } from './callout';

const meta = {
  title: 'UI/Components',
  component: CalloutComponent,
  args: {
    children: 'Happenings have transpired! Prepare for events.',
    size: 2,
    variant: 'soft',
    color: 'accent',
    highContrast: false,
  },
  argTypes: {
    ...marginArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['soft', 'surface', 'outline'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral'],
    },
    highContrast: {
      control: 'boolean',
    },
    children: { control: 'text' },
  },
} satisfies Meta<CalloutProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Callout: Story = {};
