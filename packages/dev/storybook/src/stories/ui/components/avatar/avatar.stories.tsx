import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Avatar, type AvatarProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const VARIANTS = ['solid', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const meta = {
  title: 'UI/Components/Avatar',
  component: Avatar,
  args: {
    alt: 'Gill Bates',
    fallback: 'GB',
    size: 2,
    variant: 'soft',
    color: 'accent',
    radius: 'full',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    src: { control: 'text' },
    alt: { control: 'text' },
    fallback: { control: 'text' },
    delayMs: { control: 'number' },
    size: { control: { type: 'range', min: 1, max: 3, step: 1 } },
    variant: { control: 'inline-radio', options: VARIANTS },
    color: { control: 'inline-radio', options: COLORS },
    radius: { control: 'inline-radio', options: RADII },
  },
} satisfies Meta<AvatarProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
