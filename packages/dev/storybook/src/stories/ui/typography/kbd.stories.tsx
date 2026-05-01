import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Kbd as KbdComponent, type KbdProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Typography',
  component: KbdComponent,
  args: {
    variant: 'classic',
    children: 'Shift + Tab',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['classic', 'soft'],
    },
  },
  render: (props) => <KbdComponent {...props} />,
} satisfies Meta<KbdProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kbd: Story = {};
