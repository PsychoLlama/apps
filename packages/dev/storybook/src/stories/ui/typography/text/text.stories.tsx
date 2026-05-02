import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Text, type TextProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { trimArgTypes } from '@lib/ui/props/trim';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { selectableArgTypes } from '@lib/ui/props/selectable';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const TAGS = ['p', 'span', 'label', 'blockquote'] as const;
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const WEIGHTS = ['light', 'regular', 'medium', 'bold'] as const;
const ALIGNS = ['left', 'center', 'right'] as const;
const COLORS = ['highContrast', 'lowContrast'] as const;

const defaults = { as: 'p', testId: 'overview' } as const;
const sample = 'Sphinx of black quartz, judge my vow';

const meta = {
  title: 'UI/Typography/Text',
  component: Text,
  args: {
    children: 'Sphinx of black quartz, judge my vow',
    as: 'p',
    size: 3,
    ...skeletonArgs,
  },
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['p', 'span', 'label', 'blockquote'],
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
} satisfies Meta<TextProps<'p'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Tag',
      items: TAGS.map((as) => (
        <Text {...defaults} as={as}>
          {as}
        </Text>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Text {...defaults} size={size}>
          {sample}
        </Text>
      )),
    },
    {
      title: 'Weight',
      items: WEIGHTS.map((weight) => (
        <Text {...defaults} weight={weight}>
          {weight}
        </Text>
      )),
    },
    {
      title: 'Align',
      items: ALIGNS.map((align) => (
        <Text {...defaults} align={align} style={{ width: '14rem' }}>
          {align}
        </Text>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Text {...defaults} color={color}>
          {color}
        </Text>
      )),
    },
  ],
});

export const Playground: Story = {};
