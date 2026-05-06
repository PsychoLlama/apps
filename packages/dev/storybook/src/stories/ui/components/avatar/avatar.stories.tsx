import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Avatar, type AvatarProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import SAMPLE_SRC from './sample-avatar.svg?url';
import { gallery } from '../../../../gallery';

const VARIANTS = ['solid', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

// The error story uses a guaranteed-broken URL to exercise the
// fallback path; the loaded state uses a bundled SVG so the gallery
// renders without a network.
const BROKEN_SRC = 'https://example.invalid/avatar.png';

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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Avatar alt="Gill Bates" fallback="GB" variant={variant} />
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Avatar alt="Gill Bates" fallback="GB" color={color} variant="solid" />
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Avatar alt="Gill Bates" fallback="GB" size={size} />
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <Avatar alt="Gill Bates" fallback="GB" radius={radius} />
      )),
    },
    {
      title: 'State',
      items: [
        <Avatar alt="Gill Bates" fallback="GB" src={SAMPLE_SRC} />,
        <Avatar alt="Gill Bates" fallback="GB" src={BROKEN_SRC} />,
        <Avatar alt="Gill Bates" fallback="GB" />,
      ],
    },
  ],
});

export const Playground: Story = {};
