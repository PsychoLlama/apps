import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import IconHeart from 'virtual:icons/mdi/heart';
import {
  IconButton as IconButtonComponent,
  type IconButtonProps,
} from '@lib/ui';
import { buttonStyleArgTypes } from '@lib/ui/props/button';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: IconButtonComponent,
  args: {
    'aria-label': 'Like',
    children: <IconHeart />,
    size: 2,
    variant: 'solid',
    color: 'accent',
    onClick: fn(),
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...buttonStyleArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<IconButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconButton: Story = {};
