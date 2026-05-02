import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import { Button, type ButtonProps } from '@lib/ui';
import { buttonStyleArgTypes } from '@lib/ui/props/button';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3, 4] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = { as: 'button', testId: 'overview' } as const;

const meta = {
  title: 'UI/Components/Button',
  component: Button,
  args: {
    children: 'Button',
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
    as: {
      control: 'inline-radio',
      options: ['button', 'summary'],
    },
    disabled: {
      control: 'boolean',
    },
    children: { control: 'text' },
  },
} satisfies Meta<ButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Button {...defaults} variant={variant}>
          {variant}
        </Button>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Button {...defaults} color={color}>
          {color}
        </Button>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Button {...defaults} size={size}>
          Size {size}
        </Button>
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <Button {...defaults} radius={radius}>
          {radius}
        </Button>
      )),
    },
    {
      title: 'Disabled',
      items: VARIANTS.map((variant) => (
        <Button {...defaults} variant={variant} disabled>
          {variant}
        </Button>
      )),
    },
  ],
});

export const Playground: Story = {};
