import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Avatar, type AvatarProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['solid', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

// Inline 1x1 PNG that always resolves so the gallery shows the loaded
// state without depending on a network. The error story uses a
// guaranteed-broken URL to exercise the fallback path.
const SAMPLE_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const BROKEN_SRC = 'https://example.invalid/avatar.png';

const meta = {
  title: 'UI/Components/Avatar',
  component: Avatar,
  args: {
    alt: 'Jane Doe',
    fallback: 'JD',
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
        <Avatar alt="Jane Doe" fallback="JD" variant={variant} />
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Avatar alt="Jane Doe" fallback="JD" color={color} variant="solid" />
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Avatar alt="Jane Doe" fallback="JD" size={size} />
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <Avatar alt="Jane Doe" fallback="JD" radius={radius} />
      )),
    },
    {
      title: 'State',
      items: [
        <Avatar alt="Jane Doe" fallback="JD" src={SAMPLE_SRC} />,
        <Avatar alt="Jane Doe" fallback="JD" src={BROKEN_SRC} />,
        <Avatar alt="Jane Doe" fallback="JD" />,
      ],
    },
  ],
});

export const Playground: Story = {};
