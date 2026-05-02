import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import IconHeart from 'virtual:icons/mdi/heart';
import { IconButton, type IconButtonProps } from '@lib/ui';
import { buttonStyleArgTypes } from '@lib/ui/props/button';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3, 4] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = {
  'aria-label': 'Like',
  testId: 'overview',
} as const;

const meta = {
  title: 'UI/Components/IconButton',
  component: IconButton,
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
    disabled: { control: 'boolean' },
    children: { table: { disable: true } },
  },
} satisfies Meta<IconButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <IconButton {...defaults} variant={variant}>
          <IconHeart />
        </IconButton>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <IconButton {...defaults} color={color}>
          <IconHeart />
        </IconButton>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <IconButton {...defaults} size={size}>
          <IconHeart />
        </IconButton>
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <IconButton {...defaults} radius={radius}>
          <IconHeart />
        </IconButton>
      )),
    },
    {
      title: 'Disabled',
      items: VARIANTS.map((variant) => (
        <IconButton {...defaults} variant={variant} disabled>
          <IconHeart />
        </IconButton>
      )),
    },
  ],
});

export const Playground: Story = {};
