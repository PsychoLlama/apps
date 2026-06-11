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
import { amber } from '@lib/design/palette/amber';
import { blue } from '@lib/design/palette/blue';
import { bronze } from '@lib/design/palette/bronze';
import { brown } from '@lib/design/palette/brown';
import { crimson } from '@lib/design/palette/crimson';
import { cyan } from '@lib/design/palette/cyan';
import { gold } from '@lib/design/palette/gold';
import { grass } from '@lib/design/palette/grass';
import { gray } from '@lib/design/palette/gray';
import { green } from '@lib/design/palette/green';
import { indigo } from '@lib/design/palette/indigo';
import { iris } from '@lib/design/palette/iris';
import { jade } from '@lib/design/palette/jade';
import { lime } from '@lib/design/palette/lime';
import { mauve } from '@lib/design/palette/mauve';
import { mint } from '@lib/design/palette/mint';
import { olive } from '@lib/design/palette/olive';
import { orange } from '@lib/design/palette/orange';
import { pink } from '@lib/design/palette/pink';
import { plum } from '@lib/design/palette/plum';
import { purple } from '@lib/design/palette/purple';
import { red } from '@lib/design/palette/red';
import { ruby } from '@lib/design/palette/ruby';
import { sage } from '@lib/design/palette/sage';
import { sand } from '@lib/design/palette/sand';
import { sky } from '@lib/design/palette/sky';
import { slate } from '@lib/design/palette/slate';
import { teal } from '@lib/design/palette/teal';
import { tomato } from '@lib/design/palette/tomato';
import { violet } from '@lib/design/palette/violet';
import { yellow } from '@lib/design/palette/yellow';
import TokenRow from '../../../token-row';
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
      <Heading
        as="h3"
        size={2}
        color="lowContrast"
        weight="medium"
        selectable={false}
      >
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
              selectable={false}
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
              <Heading as="h3" size={2} weight="medium" selectable={false}>
                {item.name}
              </Heading>
              <Text as="p" size={5} selectable style={{ color: item.value }}>
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
              selectable={false}
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
