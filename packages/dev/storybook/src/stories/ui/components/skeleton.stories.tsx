import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import {
  Flex,
  Heading,
  Skeleton as SkeletonComponent,
  type SkeletonProps,
  Text,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: SkeletonComponent,
  args: {
    as: 'span',
    loading: true,
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    as: {
      control: 'inline-radio',
      options: ['span', 'div'],
    },
    loading: {
      control: 'boolean',
    },
  },
  render: (props) => (
    <Flex as="div" direction="column" gap={4} style={{ 'max-width': '32rem' }}>
      <Heading as="h3" size={4}>
        Wrapping inline text
      </Heading>
      <Text as="p" size={3}>
        Lorem ipsum dolor sit{' '}
        <SkeletonComponent {...props}>amet, consectetur</SkeletonComponent>{' '}
        adipiscing elit, sed do eiusmod{' '}
        <SkeletonComponent {...props}>tempor</SkeletonComponent> incididunt ut
        labore et dolore magna aliqua.
      </Text>

      <Heading as="h3" size={4}>
        Standalone block
      </Heading>
      <SkeletonComponent
        as="div"
        loading={props.loading}
        style={{ width: '100%', height: '8rem' }}
      />

      <Heading as="h3" size={4}>
        Wrapping a block element
      </Heading>
      <SkeletonComponent as="div" loading={props.loading}>
        <Heading as="h2" size={6}>
          Loaded title goes here
        </Heading>
      </SkeletonComponent>
    </Flex>
  ),
} satisfies Meta<SkeletonProps<'span'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Skeleton: Story = {};
