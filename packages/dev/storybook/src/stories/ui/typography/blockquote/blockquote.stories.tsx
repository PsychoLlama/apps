import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import {
  Blockquote as BlockquoteComponent,
  type BlockquoteProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { selectableArgTypes } from '@lib/ui/props/selectable';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { wrapArgTypes } from '@lib/ui/props/wrap';

const SAMPLE =
  'Twenty years from now you will be more disappointed by the things you didn’t do than by the ones you did.';

const meta = {
  title: 'UI/Typography',
  component: BlockquoteComponent,
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

export const Blockquote: Story = {};
