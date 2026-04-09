import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { shadow } from '#design';
import { Box, Flex, Heading, Text } from '#ui';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: Record<string, string> = {
  1: 'Inset (inputs, switches)',
  2: 'Slight (floating indicators)',
  3: 'Medium (raised surfaces)',
  4: 'High (hover cards, tooltips)',
  5: 'Higher (dropdowns, popovers)',
  6: 'Maximum (modals, dialogs)',
};

export const Shadows: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For each={Object.entries(shadow)}>
        {([step, value]) => (
          <Flex as="div" align="center" gap={4}>
            <Box
              as="div"
              p={5}
              background="panelSolid"
              radius={4}
              style={{ 'box-shadow': value }}
            />
            <Box as="div">
              <Heading as="h3" size={2} weight="medium">
                shadow[{step}]
              </Heading>
              <Text as="p" size={2} color="lowContrast">
                {labels[step]}
              </Text>
            </Box>
          </Flex>
        )}
      </For>
    </Flex>
  ),
};
