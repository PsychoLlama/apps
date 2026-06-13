import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Callout, type CalloutProps, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const Body = (props: { label: string }) => (
  <Text as="p" size={2} selectable>
    {props.label}
  </Text>
);

const meta = {
  title: 'UI/Components/Callout',
  component: Callout,
  args: {
    children: <Body label="Happenings have transpired! Prepare for events." />,
    size: 2,
    variant: 'soft',
    color: 'accent',
    highContrast: false,
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['soft', 'surface', 'outline'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    highContrast: { control: 'boolean' },
  },
} satisfies Meta<CalloutProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
