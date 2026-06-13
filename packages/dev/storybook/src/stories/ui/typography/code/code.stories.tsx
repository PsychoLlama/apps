import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Code, Text, type CodeProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { selectableArgTypes } from '@lib/ui/props/selectable';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { wrapArgTypes } from '@lib/ui/props/wrap';

const meta = {
  title: 'UI/Typography/Code',
  component: Code,
  args: {
    children: 'console.log()',
    variant: 'soft',
    color: 'accent',
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
    variant: {
      control: 'inline-radio',
      options: ['solid', 'soft', 'outline', 'ghost'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    weight: {
      control: 'inline-radio',
      options: ['light', 'regular', 'medium', 'bold'],
    },
    children: { control: 'text' },
  },
} satisfies Meta<CodeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (props: CodeProps) => (
    <Text as="p" size={3} selectable>
      Press <Code {...props} /> to continue.
    </Text>
  ),
};
