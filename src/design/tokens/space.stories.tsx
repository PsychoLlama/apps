import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { space } from '#design';
import { Text } from '#ui';
import * as css from './space.stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spacing: Story = {
  render: () => (
    <div class={css.spacingGrid}>
      <For each={Object.entries(space)}>
        {([step, value]) => (
          <>
            <Text as="div" size={2} color="lowContrast">
              space[{step}]{' '}
              <span style={{ opacity: 0.6 }}>({value})</span>
            </Text>
            <div class={css.spacingBar} style={{ width: value }} />
          </>
        )}
      </For>
    </div>
  ),
};
