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
import { Box, Flex, Grid, Heading, Text } from '#ui';
import TokenRow from '../stories/token-row';
import * as css from './color.stories.css';

type ColorScale = Record<number, string>;

function ScaleRow(props: { name: string; scale: ColorScale; alpha?: boolean }) {
  const steps = () =>
    Object.entries(props.scale).map(([step, value]) => ({ step, value }));

  return (
    <>
      <Heading as="h3" size={2} color="lowContrast" weight="medium">
        {props.name}
      </Heading>

      <Grid as="div" gap={3} class={css.scaleGrid}>
        <For each={steps()}>
          {(item) => (
            <Box
              as="div"
              radius={3}
              class={`${css.swatch} ${props.alpha ? css.checkerboard : ''}`}
            >
              <Box
                as="div"
                radius={3}
                class={css.swatchOverlay}
                style={{ 'background-color': item.value }}
              />
            </Box>
          )}
        </For>
      </Grid>
    </>
  );
}

const meta = {
  title: 'Design System/Colors',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scales: Story = {
  render: () => (
    <Grid as="div" gap={3} align="center" class={css.scaleRow}>
      <Box as="div" />
      <Grid as="div" gap={3} class={css.scaleGrid}>
        <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}>
          {(step) => (
            <Heading
              as="h4"
              size={2}
              color="lowContrast"
              weight="medium"
              align="center"
            >
              scale[{step}]
            </Heading>
          )}
        </For>
      </Grid>

      <ScaleRow name="neutral" scale={neutral} />
      <ScaleRow name="neutralAlpha" scale={neutralAlpha} alpha />
      <ScaleRow name="accent" scale={accent} />
      <ScaleRow name="accentAlpha" scale={accentAlpha} alpha />
      <ScaleRow name="danger" scale={danger} />
      <ScaleRow name="warning" scale={warning} />
      <ScaleRow name="success" scale={success} />
    </Grid>
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
            <Box
              as="div"
              radius={3}
              class={css.textSwatch}
              style={{ 'background-color': item.value }}
            />
            <Box as="div">
              <Heading as="h3" size={2} weight="medium">
                {item.name}
              </Heading>
              <Text as="p" size={5} style={{ color: item.value }}>
                The quick brown fox jumps over the lazy dog
              </Text>
            </Box>
          </Flex>
        )}
      </For>
    </Flex>
  ),
};

export const BackgroundColors: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={5}>
      <For
        each={[
          {
            name: 'background.page',
            value: background.page,
            desc: 'App canvas',
          },
          {
            name: 'background.panelSolid',
            value: background.panelSolid,
            desc: 'Opaque elevated containers',
          },
          {
            name: 'background.panelTranslucent',
            value: background.panelTranslucent,
            desc: 'Semi-transparent elevated containers',
          },
          {
            name: 'background.surface',
            value: background.surface,
            desc: 'Recessed interactive surfaces',
          },
          {
            name: 'background.overlay',
            value: background.overlay,
            desc: 'Modal backdrops',
          },
        ]}
      >
        {(item) => (
          <TokenRow name={item.name} description={item.desc}>
            <Box
              as="div"
              radius={3}
              class={css.bgSwatch}
              style={{ 'background-color': item.value }}
            />
          </TokenRow>
        )}
      </For>
    </Flex>
  ),
};
