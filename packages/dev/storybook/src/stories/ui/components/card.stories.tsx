import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Card as CardComponent, type CardProps, Heading, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: CardComponent,
  args: {
    as: 'div',
    size: 1,
    variant: 'surface',
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 5, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['surface', 'classic', 'ghost'],
    },
  },
  render: (props) => (
    <CardComponent {...props}>
      <Heading as="h3" size={3}>
        Card title
      </Heading>
      <Text as="p" size={2}>
        Cards group related content into a single surface. Pick a variant to
        switch between subtle, elevated, and borderless treatments.
      </Text>
    </CardComponent>
  ),
} satisfies Meta<CardProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {};
