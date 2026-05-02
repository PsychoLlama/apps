import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Card, type CardProps, Heading, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['surface', 'classic', 'ghost'] as const;
const SIZES = [1, 2, 3, 4, 5] as const;

const defaults = { as: 'div', testId: 'overview' } as const;

const Body = (props: { title: string }) => (
  <>
    <Heading as="h3" size={3}>
      {props.title}
    </Heading>
    <Text as="p" size={2}>
      Cards group related content into a single surface.
    </Text>
  </>
);

const meta = {
  title: 'UI/Components/Card',
  component: Card,
  args: {
    as: 'div',
    children: <Body title="Card title" />,
    size: 1,
    variant: 'surface',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    as: {
      control: 'inline-radio',
      options: ['div', 'section', 'article', 'aside', 'a', 'button', 'label'],
    },
    size: {
      control: { type: 'range', min: 1, max: 5, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['surface', 'classic', 'ghost'],
    },
  },
} satisfies Meta<CardProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Card {...defaults} variant={variant}>
          <Body title={variant} />
        </Card>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Card {...defaults} size={size}>
          <Body title={`Size ${size}`} />
        </Card>
      )),
    },
  ],
});

export const Playground: Story = {};
