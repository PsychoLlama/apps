import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { radius } from '#design';
import { Box, Flex, Heading, Text } from '#ui';
import * as css from './radius.stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const labels: Record<string, string> = {
  1: 'Compact controls',
  2: 'Default interactive',
  3: 'Small containers',
  4: 'Standard containers',
  5: 'Large containers',
  6: 'Maximum rounding',
  full: 'Pill shape',
};

export const Radius: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For each={Object.entries(radius)}>
        {([step, value]) => (
          <Flex as="div" align="center" gap={4}>
            <Box
              as="div"
              background="panelSolid"
              shadow={2}
              class={css.radiusBox}
              style={{ 'border-radius': value }}
            />
            <Box as="div">
              <Heading as="h3" size={2} weight="medium">
                {step === 'full' ? 'radius.full' : `radius[${step}]`}
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
