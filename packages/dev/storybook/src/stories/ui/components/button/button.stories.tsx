import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import type { JSX } from 'solid-js';
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

type CellProps = Omit<
  Extract<ButtonProps, { as?: 'button' }>,
  'as' | 'testId'
> & { children: JSX.Element };

const Cell = (props: CellProps) => (
  <Button as="button" testId="overview" {...props} />
);

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
        <Button as="button" testId="overview" variant={variant}>
          {variant}
        </Button>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => <Cell color={color}>{color}</Cell>),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Cell size={size}>Size {size}</Cell>),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => <Cell radius={radius}>{radius}</Cell>),
    },
    {
      title: 'Disabled',
      items: VARIANTS.map((variant) => (
        <Cell variant={variant} disabled>
          {variant}
        </Cell>
      )),
    },
  ],
});

export const Playground: Story = {};
