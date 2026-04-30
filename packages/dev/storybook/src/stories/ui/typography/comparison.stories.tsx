import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { Flex, Heading, Text } from '@lib/ui';

const meta = {
  title: 'UI/Typography',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const sizes = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const sample = 'Sphinx of black quartz, judge my vow';

export const Comparison: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={6}>
      <For each={sizes}>
        {(size) => (
          <Flex as="div" direction="column" gap={2}>
            <Text as="span" size={1} color="lowContrast">
              size {size}
            </Text>
            <Flex as="div" direction="row" gap={5} wrap="wrap">
              <Flex
                as="div"
                direction="column"
                gap={1}
                style={{ flex: '1 1 0' }}
              >
                <Text as="span" size={1} color="lowContrast">
                  Heading
                </Text>
                <Heading as="h3" size={size}>
                  {sample}
                </Heading>
              </Flex>
              <Flex
                as="div"
                direction="column"
                gap={1}
                style={{ flex: '1 1 0' }}
              >
                <Text as="span" size={1} color="lowContrast">
                  Text
                </Text>
                <Text as="p" size={size}>
                  {sample}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        )}
      </For>
    </Flex>
  ),
};
