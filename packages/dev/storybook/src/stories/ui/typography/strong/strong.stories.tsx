import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Strong as StrongComponent, Text, type StrongProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { wrapArgTypes } from '@lib/ui/props/wrap';

const meta = {
  title: 'UI/Typography',
  component: StrongComponent,
  args: {
    children: 'important',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...wrapArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    children: { control: 'text' },
  },
} satisfies Meta<StrongProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Strong: Story = {
  render: (props: StrongProps) => (
    <Text as="p" size={3} selectable>
      The quick brown fox jumps over the <StrongComponent {...props} /> dog.
    </Text>
  ),
};
