import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Heading, type HeadingProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { trimArgTypes } from '@lib/ui/props/trim';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { selectableArgTypes } from '@lib/ui/props/selectable';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const WEIGHTS = ['light', 'regular', 'medium', 'bold'] as const;
const ALIGNS = ['left', 'center', 'right'] as const;
const COLORS = ['highContrast', 'lowContrast'] as const;

const defaults = { as: 'h3', testId: 'overview' } as const;
const sample = 'Sphinx of black quartz';

const meta = {
  title: 'UI/Typography/Heading',
  component: Heading,
  args: {
    children: 'Sphinx of black quartz, judge my vow',
    as: 'h1',
    size: 6,
    weight: 'bold',
    ...skeletonArgs,
  },
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
    size: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    weight: {
      control: 'inline-radio',
      options: ['light', 'regular', 'medium', 'bold'],
    },
    align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
    },
    color: {
      control: 'inline-radio',
      options: ['highContrast', 'lowContrast'],
    },
    children: { control: 'text' },
    ...trimArgTypes,
    ...truncateArgTypes,
    ...marginArgTypes,
    ...selectableArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
  },
} satisfies Meta<HeadingProps<'h1'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Tag',
      items: TAGS.map((as) => (
        <Heading {...defaults} as={as}>
          {as}
        </Heading>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Heading {...defaults} size={size}>
          {sample}
        </Heading>
      )),
    },
    {
      title: 'Weight',
      items: WEIGHTS.map((weight) => (
        <Heading {...defaults} size={5} weight={weight}>
          {weight}
        </Heading>
      )),
    },
    {
      title: 'Align',
      items: ALIGNS.map((align) => (
        <Heading
          {...defaults}
          size={4}
          align={align}
          style={{ width: '14rem' }}
        >
          {align}
        </Heading>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Heading {...defaults} size={5} color={color}>
          {color}
        </Heading>
      )),
    },
  ],
});

export const Playground: Story = {};
