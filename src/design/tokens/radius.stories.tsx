import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { radius } from '#design';
import * as css from './radius.stories.css';
import { muted } from './_stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Radius: Story = {
  render: () => (
    <div class={css.radiusGrid}>
      <For each={Object.entries(radius)}>
        {([step, value]) => (
          <div class={css.radiusItem}>
            <div class={css.radiusBox} style={{ 'border-radius': value }} />
            <div class={css.radiusLabel}>radius.{step}</div>
            <div class={`${css.radiusLabel} ${muted}`}>{value}</div>
          </div>
        )}
      </For>
    </div>
  ),
};
