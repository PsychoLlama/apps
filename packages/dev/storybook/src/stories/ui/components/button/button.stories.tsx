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

export const Overview: Story = gallery(Button, {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => ({
        args: { variant, children: variant },
      })),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => ({ args: { color, children: color } })),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => ({
        args: { size, children: `Size ${size}` },
      })),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => ({ args: { radius, children: radius } })),
    },
    {
      title: 'Disabled',
      args: { disabled: true },
      items: VARIANTS.map((variant) => ({
        args: { variant, children: variant },
      })),
    },
  ],
});

export const Playground: Story = {};
