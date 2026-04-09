import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { space } from '#design';
import * as css from '../stories/stories.css';

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
            <div class={css.spacingLabel}>
              space[{step}] <span class={css.muted}>({value})</span>
            </div>
            <div class={css.spacingBar} style={{ width: value }} />
          </>
        )}
      </For>
    </div>
  ),
};
