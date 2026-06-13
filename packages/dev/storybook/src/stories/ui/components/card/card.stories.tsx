import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Card, type CardProps, Heading, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const Body = (props: { title: string }) => (
  <>
    <Heading as="h3" size={3} selectable>
      {props.title}
    </Heading>
    <Text as="p" size={2} selectable>
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

export const Playground: Story = {};
