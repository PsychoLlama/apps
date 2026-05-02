import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Flex, Progress, type ProgressProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';
import * as css from './progress.stories.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const Demo = (props: Partial<ProgressProps>) => (
  <Flex as="div" class={css.galleryCell}>
    <Progress testId="overview" value={60} {...props} />
  </Flex>
);

const meta = {
  title: 'UI/Components/Progress',
  component: Progress,
  args: {
    testId: 'progress',
    value: 60,
    max: 100,
    size: 2,
    variant: 'surface',
    radius: 'full',
    color: 'accent',
    duration: '5s',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: { type: 'number', min: 1 } },
    size: { control: { type: 'range', min: 1, max: 3, step: 1 } },
    variant: {
      control: 'inline-radio',
      options: ['classic', 'surface', 'soft'],
    },
    radius: {
      control: 'inline-radio',
      options: ['none', 'small', 'medium', 'large', 'full'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    duration: { control: 'text' },
  },
  // Constrain default Playground width so the bar has somewhere to grow
  // — the component itself is `flex-grow: 1` and would collapse to zero
  // otherwise when rendered as a story root.
  decorators: [
    (Story) => (
      <Flex as="div" class={css.playgroundFrame}>
        <Story />
      </Flex>
    ),
  ],
} satisfies Meta<ProgressProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => <Demo variant={variant} />),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => <Demo color={color} />),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} />),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => <Demo radius={radius} />),
    },
    {
      title: 'State',
      items: [
        <Demo value={0} />,
        <Demo value={40} />,
        <Demo value={100} />,
        <Demo value={null} />,
      ],
    },
  ],
});

export const Playground: Story = {};
