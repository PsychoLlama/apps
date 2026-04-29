import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Badge, Card, Flex, Heading, Text } from '@lib/ui';
import { skeletonArgTypes, type SkeletonProps } from '@lib/ui/props/skeleton';

const meta = {
  title: 'UI/Patterns',
  args: {
    skeleton: true,
  },
  argTypes: skeletonArgTypes,
  render: (props) => (
    <Flex as="div" direction="column" gap={4} style={{ 'max-width': '32rem' }}>
      <Heading as="h1" size={6} skeleton={props.skeleton}>
        Page title
      </Heading>

      <Text as="p" size={3} skeleton={props.skeleton}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </Text>

      <Text as="p" size={3}>
        Inline placeholder mid-sentence:{' '}
        <Text as="span" skeleton={props.skeleton}>
          loading value
        </Text>{' '}
        followed by more text.
      </Text>

      <Flex as="div" gap={2}>
        <Badge skeleton={props.skeleton}>Active</Badge>
        <Badge color="success" skeleton={props.skeleton}>
          Healthy
        </Badge>
        <Badge color="danger" skeleton={props.skeleton}>
          Error
        </Badge>
      </Flex>

      <Card as="div" size={3} skeleton={props.skeleton}>
        <Heading as="h2" size={4}>
          Card title
        </Heading>
        <Text as="p">
          Card body copy that the skeleton hides while loading.
        </Text>
      </Card>
    </Flex>
  ),
} satisfies Meta<SkeletonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Skeleton: Story = {};
