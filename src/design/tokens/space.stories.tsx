import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { space } from '#design';
import { Box, Grid, Text } from '#ui';
import * as css from './space.stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spacing: Story = {
  render: () => (
    <Grid as="div" gapX={4} gapY={3} align="center" class={css.spacingGrid}>
      <For each={Object.entries(space)}>
        {([step, value]) => (
          <>
            <Text as="p" size={2} color="lowContrast">
              space[{step}]
            </Text>
            <Box
              as="div"
              radius={1}
              class={css.spacingBar}
              style={{ width: value }}
            />
          </>
        )}
      </For>
    </Grid>
  ),
};
