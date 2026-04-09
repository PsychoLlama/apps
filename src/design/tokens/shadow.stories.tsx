import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { shadow } from '#design';
import { Box, Flex, Text } from '#ui';

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
    <Flex as="div" wrap="wrap" gap={6}>
      <For each={Object.entries(shadow)}>
        {([step, value]) => (
          <Flex as="div" direction="column" align="center" gap={2}>
            <Box
              as="div"
              px={6}
              py={5}
              background="panelSolid"
              radius={4}
              style={{ 'box-shadow': value }}
            >
              <Text as="span" size={2} color="lowContrast">
                shadow[{step}]
              </Text>
            </Box>
            <Text as="p" size={1} color="lowContrast">
              {labels[step]}
            </Text>
          </Flex>
        )}
      </For>
    </Flex>
  ),
};
