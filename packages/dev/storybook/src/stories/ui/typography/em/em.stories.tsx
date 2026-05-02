import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Em, Text, type EmProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { wrapArgTypes } from '@lib/ui/props/wrap';
import { gallery } from '../../../../gallery';

const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const meta = {
  title: 'UI/Typography/Em',
  component: Em,
  args: {
    children: 'really',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...wrapArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    children: { control: 'text' },
  },
} satisfies Meta<EmProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Inheriting size',
      items: SIZES.map((size) => (
        <Text as="p" size={size}>
          Quick <Em>brown</Em> fox.
        </Text>
      )),
    },
  ],
});

export const Playground: Story = {
  render: (props: EmProps) => (
    <Text as="p" size={3}>
      The quick brown fox <Em {...props} /> jumps over the lazy dog.
    </Text>
  ),
};
