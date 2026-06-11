import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Show } from 'solid-js';
import { Flex, Separator, type SeparatorProps, Text } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const SIZES = [1, 2, 3, 4] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;

const horizontal = (
  props: Omit<SeparatorProps, 'orientation' | 'decorative'>,
) => (
  <Flex as="div" direction="column" gap={2} style={{ width: '8rem' }}>
    <Text as="span" size={1} selectable={false}>
      Above
    </Text>
    <Separator orientation="horizontal" decorative {...props} />
    <Text as="span" size={1} selectable={false}>
      Below
    </Text>
  </Flex>
);

const vertical = (
  props: Omit<SeparatorProps, 'orientation' | 'decorative'>,
) => (
  <Flex as="div" align="center" gap={2} style={{ height: '3rem' }}>
    <Text as="span" size={1} selectable={false}>
      Left
    </Text>
    <Separator orientation="vertical" decorative {...props} />
    <Text as="span" size={1} selectable={false}>
      Right
    </Text>
  </Flex>
);

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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Orientation',
      items: [horizontal({}), vertical({})],
    },
    {
      title: 'Size',
      items: SIZES.map((size) => horizontal({ size })),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => horizontal({ color, size: 2 })),
    },
  ],
});

export const Playground: Story = {};
