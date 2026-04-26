import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { marginArgTypes } from '../../props/margin';
import { testIdArgTypes } from '../../props/test-id';
import BadgeComponent, { type BadgeProps } from './badge';

const meta = {
  title: 'UI/Components',
  component: BadgeComponent,
  args: {
    size: 1,
    variant: 'soft',
    color: 'accent',
    radius: 'full',
    highContrast: false,
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['solid', 'soft', 'surface', 'outline'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    radius: {
      control: 'inline-radio',
      options: ['none', 'small', 'medium', 'large', 'full'],
    },
    highContrast: {
      control: 'boolean',
    },
  },
  render: (props) => <BadgeComponent {...props}>New</BadgeComponent>,
} satisfies Meta<BadgeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Badge: Story = {};
