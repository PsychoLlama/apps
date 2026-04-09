import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import {
  accent,
  accentAlpha,
  neutral,
  neutralAlpha,
  danger,
  warning,
  success,
  text,
  background,
} from '#design';
import * as css from './color.stories.css';
import { stack } from './_stories.css';

type ColorScale = Record<number, string>;

function ScaleRow(props: { name: string; scale: ColorScale; alpha?: boolean }) {
  const steps = () =>
    Object.entries(props.scale).map(([step, value]) => ({ step, value }));

  return (
    <div>
      <div class={css.heading}>{props.name}</div>
      <div class={css.scaleGrid}>
        <For each={steps()}>
          {(item) => (
            <div>
              <div
                class={`${css.swatch} ${props.alpha ? css.checkerboard : ''}`}
              >
                <div
                  class={css.swatchOverlay}
                  style={{ 'background-color': item.value }}
                />
              </div>
              <div class={css.swatchLabel}>{item.step}</div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

const meta = {
  title: 'Design System/Colors',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scales: Story = {
  render: () => (
    <div class={stack.lg}>
      <ScaleRow name="neutral" scale={neutral} />
      <ScaleRow name="neutralAlpha" scale={neutralAlpha} alpha />
      <ScaleRow name="accent" scale={accent} />
      <ScaleRow name="accentAlpha" scale={accentAlpha} alpha />
      <ScaleRow name="danger" scale={danger} />
      <ScaleRow name="warning" scale={warning} />
      <ScaleRow name="success" scale={success} />
    </div>
  ),
};

export const TextColors: Story = {
  render: () => (
    <div class={stack.md}>
      <For
        each={[
          { name: 'text.lowContrast', value: text.lowContrast },
          { name: 'text.highContrast', value: text.highContrast },
        ]}
      >
        {(item) => (
          <div class={css.row}>
            <div
              class={css.textSwatch}
              style={{ 'background-color': item.value }}
            />
            <div>
              <div class={css.heading}>{item.name}</div>
              <div class={css.textSample} style={{ color: item.value }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  ),
};

export const BackgroundColors: Story = {
  render: () => (
    <div class={stack.sm}>
      <For
        each={[
          { name: 'background.page', value: background.page },
          { name: 'background.panelSolid', value: background.panelSolid },
          {
            name: 'background.panelTranslucent',
            value: background.panelTranslucent,
          },
          { name: 'background.surface', value: background.surface },
          { name: 'background.overlay', value: background.overlay },
        ]}
      >
        {(item) => (
          <div class={css.bgRow}>
            <div
              class={css.bgSwatch}
              style={{ 'background-color': item.value }}
            />
            <div class={css.bgLabel}>{item.name}</div>
          </div>
        )}
      </For>
    </div>
  ),
};
