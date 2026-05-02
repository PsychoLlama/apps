import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Badge, type BadgeProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['solid', 'soft', 'surface', 'outline'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = { testId: 'overview' } as const;

const meta = {
  title: 'UI/Components/Badge',
  component: Badge,
  args: {
    children: 'Badge',
    size: 1,
    variant: 'soft',
    color: 'accent',
    radius: 'full',
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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Badge {...defaults} variant={variant}>
          {variant}
        </Badge>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Badge {...defaults} color={color}>
          {color}
        </Badge>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Badge {...defaults} size={size}>
          Size {size}
        </Badge>
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <Badge {...defaults} radius={radius}>
          {radius}
        </Badge>
      )),
    },
    {
      title: 'High contrast',
      items: VARIANTS.map((variant) => (
        <Badge {...defaults} variant={variant} highContrast>
          {variant}
        </Badge>
      )),
    },
  ],
});

export const Playground: Story = {};
