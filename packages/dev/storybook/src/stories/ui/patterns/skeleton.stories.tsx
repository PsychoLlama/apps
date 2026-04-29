import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import IconMagnify from 'virtual:icons/mdi/magnify';
import IconArrowRight from 'virtual:icons/mdi/arrow-right';
import { Badge, Flex, Heading, IconButton, Text, TextField } from '@lib/ui';
import * as css from './skeleton.stories.css';

interface SkeletonShowcaseArgs {
  /** Flips every skeleton-eligible item in the layout. */
  loading: boolean;
}

const meta = {
  title: 'UI/Patterns',
  args: {
    loading: true,
  },
  argTypes: {
    loading: { control: 'boolean' },
  },
} satisfies Meta<SkeletonShowcaseArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Cross-component skeleton showcase. Demonstrates a partial-loading
 * page: the heading and surrounding paragraph are already loaded
 * while the inline timestamp, badge row, and form controls are still
 * resolving. Flip the `loading` arg to see them all settle at once.
 */
export const Skeleton: Story = {
  render: (props: SkeletonShowcaseArgs) => (
    <Flex as="div" direction="column" gap={4} class={css.layout}>
      <Heading as="h2" size={5}>
        Recent activity
      </Heading>
      <Text as="p" size={2}>
        You last signed in{' '}
        <Text as="span" skeleton={props.loading}>
          2 hours ago
        </Text>{' '}
        from your usual device.
      </Text>
      <Flex as="div" gap={2}>
        <Badge color="accent" skeleton={props.loading}>
          Verified
        </Badge>
        <Badge color="success" skeleton={props.loading}>
          Active
        </Badge>
        <Badge color="warning" skeleton={props.loading}>
          Trial
        </Badge>
      </Flex>
      <Flex as="div" gap={2} align="center">
        <TextField
          testId="search"
          placeholder="Search activity…"
          left={<IconMagnify />}
          skeleton={props.loading}
        />
        <IconButton
          testId="submit"
          aria-label="Search"
          skeleton={props.loading}
        >
          <IconArrowRight />
        </IconButton>
      </Flex>
    </Flex>
  ),
};
