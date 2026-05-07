import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Quote, Text, type QuoteProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { wrapArgTypes } from '@lib/ui/props/wrap';
import { gallery } from '../../../../gallery';

const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

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
    ...skeletonArgTypes,
    ...testIdArgTypes,
    children: { control: 'text' },
  },
} satisfies Meta<QuoteProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Inheriting size',
      items: SIZES.map((size) => (
        <Text as="p" size={size}>
          Twain wrote: <Quote>cat by the tail</Quote>.
        </Text>
      )),
    },
  ],
});

export const Playground: Story = {
  render: (props: QuoteProps) => (
    <Text as="p" size={3}>
      Twain wrote: <Quote {...props} />
    </Text>
  ),
};
