import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, splitProps, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import { Flex, Slider as SliderComponent, type SliderProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import * as css from './slider.stories.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

interface SliderArgs extends SliderProps {
  /** Initial controlled value the wrapper starts with. */
  initialValue?: number[];
}

const meta = {
  title: 'UI/Components',
  component: SliderComponent,
  args: {
    testId: 'slider',
    size: 2,
    variant: 'surface',
    radius: 'full',
    color: 'accent',
    orientation: 'horizontal',
    inverted: false,
    disabled: false,
    min: 0,
    max: 100,
    step: 1,
    minStepsBetweenThumbs: 0,
    initialValue: [50],
    // `value` / `onValueChange` are required, but the wrapper drives
    // them. Seeded to satisfy the type — hidden from the controls
    // panel via argTypes below.
    value: [50],
    onValueChange: fn(),
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
    variant: { control: 'inline-radio', options: [...VARIANTS] },
    radius: { control: 'inline-radio', options: [...RADII] },
    color: { control: 'inline-radio', options: [...COLORS] },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    inverted: { control: 'boolean' },
    disabled: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    minStepsBetweenThumbs: { control: 'number' },
    initialValue: { control: 'object' },
    value: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    onValueCommit: { table: { disable: true } },
  },
  render: (args: SliderArgs) => {
    const [storyOnly, sliderProps] = splitProps(args, [
      'initialValue',
      'value',
      'onValueChange',
    ]);
    const [value, setValue] = createSignal(
      untrack(() => storyOnly.initialValue ?? [50]),
    );
    return (
      <Flex
        as="div"
        class={
          sliderProps.orientation === 'vertical'
            ? css.playgroundVertical
            : css.playgroundHorizontal
        }
      >
        <SliderComponent
          {...sliderProps}
          value={value()}
          onValueChange={(next) => {
            storyOnly.onValueChange(next);
            setValue(next);
          }}
        />
      </Flex>
    );
  },
} satisfies Meta<SliderArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Slider: Story = {};
