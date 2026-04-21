import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { For, onCleanup, onMount } from 'solid-js';
import {
  accent,
  fast,
  moderate,
  slow,
  standard,
  entrance,
  exit,
} from '#design';
import { Flex, Grid, Heading, Text } from '#ui';
import * as css from './motion.stories.css';

const meta = {
  title: 'Design System',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const durations = [
  { label: 'fast[1]', value: fast[1] },
  { label: 'fast[2]', value: fast[2] },
  { label: 'moderate[1]', value: moderate[1] },
  { label: 'moderate[2]', value: moderate[2] },
  { label: 'slow[1]', value: slow[1] },
  { label: 'slow[2]', value: slow[2] },
];

const easings = [
  { label: 'standard.productive', value: standard.productive },
  { label: 'standard.expressive', value: standard.expressive },
  { label: 'entrance.productive', value: entrance.productive },
  { label: 'entrance.expressive', value: entrance.expressive },
  { label: 'exit.productive', value: exit.productive },
  { label: 'exit.expressive', value: exit.expressive },
];

/** Square swatch that transitions between neutral and accent on a loop. */
const ColorSwatch = (props: { duration: string }) => {
  let ref!: HTMLDivElement;

  onMount(() => {
    let timer: ReturnType<typeof setTimeout>;
    let on = false;

    const toggle = () => {
      on = !on;
      ref.style.transitionDuration = props.duration;
      ref.style.backgroundColor = on ? accent[9] : '';
      timer = setTimeout(toggle, on ? 1500 : 1000);
    };

    timer = setTimeout(toggle, 500);
    onCleanup(() => clearTimeout(timer));
  });

  return (
    <Flex
      as="div"
      radius={2}
      background="panelSolid"
      shadow={2}
      ref={ref}
      class={css.swatch}
    />
  );
};

/** Pill thumb that slides across a track, pausing 1s at each end. */
const EasingTrack = (props: { duration: string; easing: string }) => {
  let ref!: HTMLDivElement;

  onMount(() => {
    let timer: ReturnType<typeof setTimeout>;
    let reverse = false;

    const flip = () => {
      reverse = !reverse;
      ref.style.animationDirection = reverse ? 'reverse' : 'normal';
      ref.style.animationName = 'none';
      void ref.offsetWidth;
      ref.style.animationName = '';
    };

    const onEnd = () => {
      timer = setTimeout(flip, 1000);
    };

    ref.addEventListener('animationend', onEnd);
    onCleanup(() => {
      ref.removeEventListener('animationend', onEnd);
      clearTimeout(timer);
    });
  });

  return (
    <Flex
      as="div"
      radius="full"
      shadow={1}
      background="panelSolid"
      class={css.track}
    >
      <Flex
        as="div"
        radius="full"
        shadow={3}
        ref={ref}
        class={css.bar}
        style={{
          'animation-duration': props.duration,
          'animation-timing-function': props.easing,
        }}
      />
    </Flex>
  );
};

export const Motion: Story = {
  render: () => (
    <Flex as="div" direction="column" gap={7}>
      <Flex as="section" direction="column" gap={1}>
        <Heading as="h2" size={2} weight="medium">
          Easings
        </Heading>

        <Grid as="div" gap={3} align="center" class={css.easingGrid}>
          <For each={easings}>
            {(easing) => (
              <>
                <Text as="span" size={2} color="lowContrast">
                  {easing.label}
                </Text>
                <EasingTrack
                  duration={`calc(${slow[2]} * 2)`}
                  easing={easing.value}
                />
              </>
            )}
          </For>
        </Grid>
      </Flex>

      <Flex as="section" direction="column" gap={1}>
        <Heading as="h2" size={2} weight="medium">
          Durations
        </Heading>

        <Flex as="div" wrap="wrap" gap={5}>
          <For each={durations}>
            {(duration) => (
              <Flex as="div" direction="column" gap={1}>
                <ColorSwatch duration={duration.value} />
                <Text as="p" size={1} color="lowContrast" align="center">
                  {duration.label}
                </Text>
              </Flex>
            )}
          </For>
        </Flex>
      </Flex>
    </Flex>
  ),
};
