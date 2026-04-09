import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { radius } from '#design';
import { Box, Flex, Grid, Text } from '#ui';
import * as css from './radius.stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Radius: Story = {
  render: () => (
    <Grid as="div" gap={5} align="end" class={css.radiusGrid}>
      <For each={Object.entries(radius)}>
        {([step, value]) => (
          <Flex as="div" direction="column" gap={2}>
            <Box
              as="div"
              class={css.radiusBox}
              style={{ 'border-radius': value }}
            />
            <Box as="div">
              <Text as="p" size={1} color="lowContrast" align="center">
                radius.{step}
              </Text>
              <Text
                as="p"
                size={1}
                color="lowContrast"
                align="center"
                style={{ opacity: 0.6 }}
              >
                {value}
              </Text>
            </Box>
          </Flex>
        )}
      </For>
    </Grid>
  ),
};
