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
import { Flex, Heading, Text } from '#ui';
import * as css from './color.stories.css';

type ColorScale = Record<number, string>;

function ScaleRow(props: { name: string; scale: ColorScale; alpha?: boolean }) {
  const steps = () =>
    Object.entries(props.scale).map(([step, value]) => ({ step, value }));

  return (
    <div>
      <Heading as="h3" size={2} weight="medium">
        {props.name}
      </Heading>
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
              <Text as="div" size={1} color="lowContrast" align="center">
                {item.step}
              </Text>
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
    <Flex as="div" direction="column" gap={6}>
      <ScaleRow name="neutral" scale={neutral} />
      <ScaleRow name="neutralAlpha" scale={neutralAlpha} alpha />
      <ScaleRow name="accent" scale={accent} />
      <ScaleRow name="accentAlpha" scale={accentAlpha} alpha />
      <ScaleRow name="danger" scale={danger} />
      <ScaleRow name="warning" scale={warning} />
      <ScaleRow name="success" scale={success} />
    </Flex>
  ),
};

export const TextColors: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For
        each={[
          { name: 'text.lowContrast', value: text.lowContrast },
          { name: 'text.highContrast', value: text.highContrast },
        ]}
      >
        {(item) => (
          <Flex as="div" align="center" gap={4}>
            <div
              class={css.textSwatch}
              style={{ 'background-color': item.value }}
            />
            <div>
              <Heading as="h3" size={2} weight="medium">
                {item.name}
              </Heading>
              <Text as="div" size={5} style={{ color: item.value }}>
                The quick brown fox jumps over the lazy dog
              </Text>
            </div>
          </Flex>
        )}
      </For>
    </Flex>
  ),
};

export const BackgroundColors: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={3}>
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
            <Text as="div" size={2} color="highContrast">
              {item.name}
            </Text>
          </div>
        )}
      </For>
    </Flex>
  ),
};
