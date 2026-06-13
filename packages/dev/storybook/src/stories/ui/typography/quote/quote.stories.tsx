import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Quote, Text, type QuoteProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { selectableArgTypes } from '@lib/ui/props/selectable';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { wrapArgTypes } from '@lib/ui/props/wrap';

const meta = {
  title: 'UI/Typography/Quote',
  component: Quote,
  args: {
    children: 'A man who carries a cat by the tail learns something.',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...truncateArgTypes,
    ...wrapArgTypes,
    ...selectableArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    children: { control: 'text' },
  },
} satisfies Meta<QuoteProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (props: QuoteProps) => (
    <Text as="p" size={3} selectable>
      Twain wrote: <Quote {...props} />
    </Text>
  ),
};
