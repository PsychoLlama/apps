import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { shadow } from '#design';
import * as css from './shadow.stories.css';

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
    <div class={css.shadowGrid}>
      <For each={Object.entries(shadow)}>
        {([step, value]) => (
          <div class={css.shadowItem}>
            <div class={css.shadowCard} style={{ 'box-shadow': value }}>
              <span class={css.shadowLabel}>shadow[{step}]</span>
            </div>
            <div class={css.shadowCaption}>{labels[step]}</div>
          </div>
        )}
      </For>
    </div>
  ),
};
