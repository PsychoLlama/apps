import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For } from 'solid-js';
import {
  accent,
  neutral,
  danger,
  warning,
  success,
  text,
  background,
  type ColorPalette,
} from '@lib/design';
import { Flex, Grid, Heading, Text } from '@lib/ui';
import { amber } from '../palette/amber.css';
import { blue } from '../palette/blue.css';
import { bronze } from '../palette/bronze.css';
import { brown } from '../palette/brown.css';
import { crimson } from '../palette/crimson.css';
import { cyan } from '../palette/cyan.css';
import { gold } from '../palette/gold.css';
import { grass } from '../palette/grass.css';
import { gray } from '../palette/gray.css';
import { green } from '../palette/green.css';
import { indigo } from '../palette/indigo.css';
import { iris } from '../palette/iris.css';
import { jade } from '../palette/jade.css';
import { lime } from '../palette/lime.css';
import { mauve } from '../palette/mauve.css';
import { mint } from '../palette/mint.css';
import { olive } from '../palette/olive.css';
import { orange } from '../palette/orange.css';
import { pink } from '../palette/pink.css';
import { plum } from '../palette/plum.css';
import { purple } from '../palette/purple.css';
import { red } from '../palette/red.css';
import { ruby } from '../palette/ruby.css';
import { sage } from '../palette/sage.css';
import { sand } from '../palette/sand.css';
import { sky } from '../palette/sky.css';
import { slate } from '../palette/slate.css';
import { teal } from '../palette/teal.css';
import { tomato } from '../palette/tomato.css';
import { violet } from '../palette/violet.css';
import { yellow } from '../palette/yellow.css';
import TokenRow from '../storybook/token-row';
import * as css from './color.stories.css';

type ColorScaleVars = Record<number, string>;

const ScaleRow = (props: {
  name: string;
  scale: ColorScaleVars;
  alpha?: boolean;
}) => {
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
            <Flex
              as="div"
              radius={3}
              class={`${css.swatch} ${props.alpha ? css.checkerboard : ''}`}
            >
              <Flex
                as="div"
                radius={3}
                class={css.swatchOverlay}
                style={{ 'background-color': item.value }}
              />
            </Flex>
          )}
        </For>
      </Grid>
    </>
  );
};

const meta = {
  title: 'Design System/Colors',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const renderPalette = (name: string, palette: ColorPalette) => (
  <>
    <ScaleRow name={name} scale={palette.solid} />
    <ScaleRow name={`${name}Alpha`} scale={palette.alpha} alpha />
  </>
);

export const Semantic: Story = {
  render: () => (
    <Grid as="div" gap={3} align="center" class={css.scaleRow}>
      <Flex as="div" />
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

      {renderPalette('neutral', neutral)}
      {renderPalette('accent', accent)}
      {renderPalette('danger', danger)}
      {renderPalette('warning', warning)}
      {renderPalette('success', success)}
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
            <Flex
              as="div"
              radius={3}
              class={css.textSwatch}
              style={{ 'background-color': item.value }}
            />
            <Flex as="div" direction="column">
              <Heading as="h3" size={2} weight="medium">
                {item.name}
              </Heading>
              <Text as="p" size={5} style={{ color: item.value }}>
                The quick brown fox jumps over the lazy dog
              </Text>
            </Flex>
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
            <Flex
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

const palettes: { name: string; palette: ColorPalette }[] = [
  { name: 'amber', palette: amber },
  { name: 'blue', palette: blue },
  { name: 'bronze', palette: bronze },
  { name: 'brown', palette: brown },
  { name: 'crimson', palette: crimson },
  { name: 'cyan', palette: cyan },
  { name: 'gold', palette: gold },
  { name: 'grass', palette: grass },
  { name: 'gray', palette: gray },
  { name: 'green', palette: green },
  { name: 'indigo', palette: indigo },
  { name: 'iris', palette: iris },
  { name: 'jade', palette: jade },
  { name: 'lime', palette: lime },
  { name: 'mauve', palette: mauve },
  { name: 'mint', palette: mint },
  { name: 'olive', palette: olive },
  { name: 'orange', palette: orange },
  { name: 'pink', palette: pink },
  { name: 'plum', palette: plum },
  { name: 'purple', palette: purple },
  { name: 'red', palette: red },
  { name: 'ruby', palette: ruby },
  { name: 'sage', palette: sage },
  { name: 'sand', palette: sand },
  { name: 'sky', palette: sky },
  { name: 'slate', palette: slate },
  { name: 'teal', palette: teal },
  { name: 'tomato', palette: tomato },
  { name: 'violet', palette: violet },
  { name: 'yellow', palette: yellow },
];

export const Palettes: Story = {
  render: () => (
    <Grid as="div" gap={3} align="center" class={css.scaleRow}>
      <Flex as="div" />
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
        {(item) => renderPalette(item.name, item.palette)}
      </For>
    </Grid>
  ),
};
