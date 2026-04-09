import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import { typeScale, fontFamily, fontWeight } from '#design';
import * as css from '../stories/stories.css';

const meta = {
  title: 'Design System/Typography',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScale: Story = {
  render: () => (
    <div class={css.stack.md}>
      <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9] as const}>
        {(step) => {
          const scale = typeScale[step];
          return (
            <div>
              <div class={css.label}>typeScale[{step}]</div>
              <div
                class={css.sampleText}
                style={{
                  'font-size': scale.fontSize,
                  'line-height': scale.lineHeight,
                  'letter-spacing': scale.letterSpacing,
                }}
              >
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          );
        }}
      </For>
    </div>
  ),
};

export const FontFamilies: Story = {
  render: () => (
    <div class={css.stack.lg}>
      <For
        each={[
          { name: 'fontFamily.body', value: fontFamily.body },
          { name: 'fontFamily.heading', value: fontFamily.heading },
        ]}
      >
        {(item) => (
          <div>
            <div class={css.label}>{item.name}</div>
            <div
              class={css.typeSample}
              style={{ 'font-family': item.value }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        )}
      </For>
    </div>
  ),
};

export const FontWeights: Story = {
  render: () => (
    <div class={css.stack.md}>
      <For
        each={
          Object.entries(fontWeight) as Array<
            [keyof typeof fontWeight, string]
          >
        }
      >
        {([name, value]) => (
          <div>
            <div class={css.label}>
              fontWeight.{name} ({value})
            </div>
            <div class={css.typeSample} style={{ 'font-weight': value }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        )}
      </For>
    </div>
  ),
};
