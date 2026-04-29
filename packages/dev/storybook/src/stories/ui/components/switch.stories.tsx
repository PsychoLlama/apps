import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import { Switch, type SwitchProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: Switch,
  args: {
    testId: 'switch',
    size: 2,
    variant: 'surface',
    radius: 'full',
    defaultChecked: false,
    disabled: false,
    onCheckedChange: fn(),
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['classic', 'surface', 'soft'],
    },
    radius: {
      control: 'inline-radio',
      options: ['none', 'small', 'medium', 'large', 'full'],
    },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: (props) => <Switch {...props} />,
} satisfies Meta<SwitchProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Switch_: Story = { name: 'Switch' };
