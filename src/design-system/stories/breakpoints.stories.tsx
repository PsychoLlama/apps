import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { breakpoint } from '#design-system';
import * as css from './stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Breakpoints: Story = {
  render: () => (
    <table class={css.table}>
      <thead>
        <tr>
          <For each={['Token', 'Media Query']}>
            {(header) => <th class={css.th}>{header}</th>}
          </For>
        </tr>
      </thead>
      <tbody>
        <For each={Object.entries(breakpoint)}>
          {([name, value]) => (
            <tr>
              <td class={css.td}>breakpoint.{name}</td>
              <td class={css.tdMono}>{value}</td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  ),
};
