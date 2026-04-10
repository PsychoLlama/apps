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
import { amber, amberAlpha } from '../palette/amber.css';
import { blue, blueAlpha } from '../palette/blue.css';
import { bronze, bronzeAlpha } from '../palette/bronze.css';
import { brown, brownAlpha } from '../palette/brown.css';
import { crimson, crimsonAlpha } from '../palette/crimson.css';
import { cyan, cyanAlpha } from '../palette/cyan.css';
import { gold, goldAlpha } from '../palette/gold.css';
import { grass, grassAlpha } from '../palette/grass.css';
import { gray, grayAlpha } from '../palette/gray.css';
import { green, greenAlpha } from '../palette/green.css';
import { indigo, indigoAlpha } from '../palette/indigo.css';
import { iris, irisAlpha } from '../palette/iris.css';
import { jade, jadeAlpha } from '../palette/jade.css';
import { lime, limeAlpha } from '../palette/lime.css';
import { mauve, mauveAlpha } from '../palette/mauve.css';
import { mint, mintAlpha } from '../palette/mint.css';
import { olive, oliveAlpha } from '../palette/olive.css';
import { orange, orangeAlpha } from '../palette/orange.css';
import { pink, pinkAlpha } from '../palette/pink.css';
import { plum, plumAlpha } from '../palette/plum.css';
import { purple, purpleAlpha } from '../palette/purple.css';
import { red, redAlpha } from '../palette/red.css';
import { ruby, rubyAlpha } from '../palette/ruby.css';
import { sage, sageAlpha } from '../palette/sage.css';
import { sand, sandAlpha } from '../palette/sand.css';
import { sky, skyAlpha } from '../palette/sky.css';
import { slate, slateAlpha } from '../palette/slate.css';
import { teal, tealAlpha } from '../palette/teal.css';
import { tomato, tomatoAlpha } from '../palette/tomato.css';
import { violet, violetAlpha } from '../palette/violet.css';
import { yellow, yellowAlpha } from '../palette/yellow.css';
import TokenRow from '../storybook/token-row';
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

export const Semantic: Story = {
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

const palettes = [
  { name: 'amber', solid: amber, alpha: amberAlpha },
  { name: 'blue', solid: blue, alpha: blueAlpha },
  { name: 'bronze', solid: bronze, alpha: bronzeAlpha },
  { name: 'brown', solid: brown, alpha: brownAlpha },
  { name: 'crimson', solid: crimson, alpha: crimsonAlpha },
  { name: 'cyan', solid: cyan, alpha: cyanAlpha },
  { name: 'gold', solid: gold, alpha: goldAlpha },
  { name: 'grass', solid: grass, alpha: grassAlpha },
  { name: 'gray', solid: gray, alpha: grayAlpha },
  { name: 'green', solid: green, alpha: greenAlpha },
  { name: 'indigo', solid: indigo, alpha: indigoAlpha },
  { name: 'iris', solid: iris, alpha: irisAlpha },
  { name: 'jade', solid: jade, alpha: jadeAlpha },
  { name: 'lime', solid: lime, alpha: limeAlpha },
  { name: 'mauve', solid: mauve, alpha: mauveAlpha },
  { name: 'mint', solid: mint, alpha: mintAlpha },
  { name: 'olive', solid: olive, alpha: oliveAlpha },
  { name: 'orange', solid: orange, alpha: orangeAlpha },
  { name: 'pink', solid: pink, alpha: pinkAlpha },
  { name: 'plum', solid: plum, alpha: plumAlpha },
  { name: 'purple', solid: purple, alpha: purpleAlpha },
  { name: 'red', solid: red, alpha: redAlpha },
  { name: 'ruby', solid: ruby, alpha: rubyAlpha },
  { name: 'sage', solid: sage, alpha: sageAlpha },
  { name: 'sand', solid: sand, alpha: sandAlpha },
  { name: 'sky', solid: sky, alpha: skyAlpha },
  { name: 'slate', solid: slate, alpha: slateAlpha },
  { name: 'teal', solid: teal, alpha: tealAlpha },
  { name: 'tomato', solid: tomato, alpha: tomatoAlpha },
  { name: 'violet', solid: violet, alpha: violetAlpha },
  { name: 'yellow', solid: yellow, alpha: yellowAlpha },
] as const;

export const Palettes: Story = {
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

      <For each={palettes}>
        {(palette) => (
          <>
            <ScaleRow name={palette.name} scale={palette.solid} />
            <ScaleRow
              name={`${palette.name}Alpha`}
              scale={palette.alpha}
              alpha
            />
          </>
        )}
      </For>
    </Grid>
  ),
};
