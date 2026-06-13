import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Show } from 'solid-js';
import { Flex, Separator, type SeparatorProps, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';

const meta = {
  title: 'UI/Components/Separator',
  component: Separator,
  args: {
    orientation: 'horizontal',
    size: 1,
    color: 'neutral',
    decorative: true,
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    size: {
      control: { type: 'range', min: 1, max: 4, step: 1 },
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    decorative: { control: 'boolean' },
  },
  render: (props) => (
    <Show
      when={props.orientation === 'vertical'}
      fallback={
        <Flex as="div" direction="column" gap={3} style={{ width: '16rem' }}>
          <Text as="span" selectable={false}>
            Above
          </Text>
          <Separator {...props} />
          <Text as="span" selectable={false}>
            Below
          </Text>
        </Flex>
      }
    >
      <Flex as="div" align="center" gap={3} style={{ height: '4rem' }}>
        <Text as="span" selectable={false}>
          Left
        </Text>
        <Separator {...props} />
        <Text as="span" selectable={false}>
          Right
        </Text>
      </Flex>
    </Show>
  ),
} satisfies Meta<SeparatorProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
