import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import IconCheck from 'virtual:icons/mdi/check';
import { Badge, Flex, Heading, IconButton, Text, TextField } from '@lib/ui';
import * as css from './skeleton.stories.css';

interface SkeletonShowcaseArgs {
  /** Flips every skeleton-enabled component in the layout at once. */
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
 * Cross-component skeleton showcase. The copy below is the demo —
 * each block describes how skeleton behaves on the components it
 * uses. Flip the `loading` arg to compare loaded and skeletonized
 * states side-by-side.
 */
export const Skeleton: Story = {
  render: (props: SkeletonShowcaseArgs) => (
    <Flex as="div" direction="column" gap={4} class={css.layout}>
      <Heading as="h2" size={5}>
        The skeleton prop
      </Heading>
      <Text as="p" size={2}>
        Pass{' '}
        <Text as="span" weight="bold">
          skeleton
        </Text>{' '}
        on any component to render it as{' '}
        <Text as="span" skeleton={props.loading}>
          a pulsing placeholder
        </Text>{' '}
        while the data behind it loads. Layout, margin, and corner shape survive
        — only the variant background and text color step out of the way.
      </Text>
      <Flex as="div" gap={2}>
        <Badge color="accent" skeleton={props.loading}>
          accent
        </Badge>
        <Badge color="success" skeleton={props.loading}>
          success
        </Badge>
        <Badge color="warning" skeleton={props.loading}>
          warning
        </Badge>
      </Flex>
      <Text as="p" size={2}>
        Color variants collapse to the same neutral pulse, so a skeleton row
        reads as one loading region instead of three styled chips.
      </Text>
      <Flex as="div" gap={2} align="center">
        <TextField
          testId="example-input"
          placeholder="Form controls become inert"
          autocomplete={undefined}
          autocapitalize={undefined}
          enterkeyhint={undefined}
          skeleton={props.loading}
        />
        <IconButton
          testId="example-button"
          aria-label="Confirm"
          skeleton={props.loading}
        >
          <IconCheck />
        </IconButton>
      </Flex>
      <Text as="p" size={2}>
        Inputs and buttons are individually skeletonized. While loading, focus,
        pointer events, and form submission are all suppressed — flip the toggle
        and try tabbing through.
      </Text>
    </Flex>
  ),
};
