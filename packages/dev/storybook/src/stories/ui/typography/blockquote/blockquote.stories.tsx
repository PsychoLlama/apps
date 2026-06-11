import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Blockquote, type BlockquoteProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { selectableArgTypes } from '@lib/ui/props/selectable';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { wrapArgTypes } from '@lib/ui/props/wrap';
import { gallery } from '../../../../gallery';

const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const SAMPLE =
  'Twenty years from now you will be more disappointed by the things you didn’t do than by the ones you did.';

const defaults = { testId: 'overview' } as const;

const meta = {
  title: 'UI/Typography/Blockquote',
  component: Blockquote,
  args: {
    children: SAMPLE,
    color: 'accent',
    selectable: true,
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...truncateArgTypes,
    ...wrapArgTypes,
    ...selectableArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: { control: { type: 'range', min: 1, max: 9, step: 1 } },
    weight: {
      control: 'inline-radio',
      options: ['light', 'regular', 'medium', 'bold'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    children: { control: 'text' },
  },
} satisfies Meta<BlockquoteProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Blockquote {...defaults} selectable color={color}>
          {SAMPLE}
        </Blockquote>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Blockquote {...defaults} selectable size={size}>
          Size {size}: {SAMPLE}
        </Blockquote>
      )),
    },
  ],
});

export const Playground: Story = {};
