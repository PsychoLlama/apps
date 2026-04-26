import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Callout as CalloutComponent, type CalloutProps, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components',
  component: CalloutComponent,
  args: {
    size: 2,
    variant: 'soft',
    color: 'accent',
    highContrast: false,
  },
  argTypes: {
    ...marginArgTypes,
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
    highContrast: {
      control: 'boolean',
    },
  },
  render: (props) => (
    <CalloutComponent {...props}>
      <Text as="p" size={2}>
        Happenings have transpired! Prepare for events.
      </Text>
    </CalloutComponent>
  ),
} satisfies Meta<CalloutProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Callout: Story = {};
