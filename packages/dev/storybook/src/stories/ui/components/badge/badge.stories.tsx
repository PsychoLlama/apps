import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Badge, type BadgeProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components/Badge',
  component: Badge,
  args: {
    children: 'Badge',
    size: 1,
    variant: 'soft',
    color: 'accent',
    highContrast: false,
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
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
    highContrast: { control: 'boolean' },
    children: { control: 'text' },
  },
} satisfies Meta<BadgeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
