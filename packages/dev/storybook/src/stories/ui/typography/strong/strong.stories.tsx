import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Strong, Text, type StrongProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const meta = {
  title: 'UI/Typography/Strong',
  component: Strong,
  args: {
    children: 'important',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    children: { control: 'text' },
  },
} satisfies Meta<StrongProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Inheriting size',
      items: SIZES.map((size) => (
        <Text as="p" size={size}>
          Quick <Strong>brown</Strong> fox.
        </Text>
      )),
    },
  ],
});

export const Playground: Story = {
  render: (props: StrongProps) => (
    <Text as="p" size={3}>
      The quick brown fox jumps over the <Strong {...props} /> dog.
    </Text>
  ),
};
