import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Code, Text, type CodeProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { wrapArgTypes } from '@lib/ui/props/wrap';
import { gallery } from '../../../../gallery';

const VARIANTS = ['solid', 'soft', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const defaults = { testId: 'overview' } as const;

const meta = {
  title: 'UI/Typography/Code',
  component: Code,
  args: {
    children: 'console.log()',
    variant: 'soft',
    color: 'accent',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...truncateArgTypes,
    ...wrapArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: { control: { type: 'range', min: 1, max: 9, step: 1 } },
    variant: {
      control: 'inline-radio',
      options: ['solid', 'soft', 'outline', 'ghost'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    weight: {
      control: 'inline-radio',
      options: ['light', 'regular', 'medium', 'bold'],
    },
    children: { control: 'text' },
  },
} satisfies Meta<CodeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Code {...defaults} variant={variant}>
          {variant}
        </Code>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Code {...defaults} color={color}>
          {color}
        </Code>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Code {...defaults} size={size}>
          size {size}
        </Code>
      )),
    },
    {
      title: 'Inheriting size',
      items: SIZES.map((size) => (
        <Text as="p" size={size}>
          Run <Code>npm install</Code> to get started.
        </Text>
      )),
    },
  ],
});

export const Playground: Story = {
  render: (props: CodeProps) => (
    <Text as="p" size={3}>
      Press <Code {...props} /> to continue.
    </Text>
  ),
};
