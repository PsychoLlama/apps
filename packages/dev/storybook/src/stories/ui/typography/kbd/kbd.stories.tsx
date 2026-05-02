import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Kbd, type KbdProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['classic', 'soft'] as const;
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const defaults = { testId: 'overview' } as const;

const meta = {
  title: 'UI/Typography/Kbd',
  component: Kbd,
  args: {
    children: 'Shift + Tab',
    variant: 'classic',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['classic', 'soft'],
    },
    children: { control: 'text' },
  },
} satisfies Meta<KbdProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Kbd {...defaults} variant={variant}>
          {variant}
        </Kbd>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Kbd {...defaults} size={size}>
          ⌘ K
        </Kbd>
      )),
    },
  ],
});

export const Playground: Story = {};
