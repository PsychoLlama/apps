import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, splitProps, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import { Flex, Slider, type SliderProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const Demo = (props: Partial<SliderProps> & { initialValue?: number[] }) => {
  const [value, setValue] = createSignal(
    untrack(() => props.initialValue ?? [40]),
  );
  return (
    <Flex as="div" style={{ width: '12rem' }}>
      <Slider
        testId="overview"
        {...props}
        value={value()}
        onValueChange={setValue}
      />
    </Flex>
  );
};

interface SliderArgs extends SliderProps {
  /** Initial controlled value the wrapper starts with. */
  initialValue?: number[];
}

const meta = {
  title: 'UI/Components/Slider',
  component: Slider,
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
        style={{
          width: sliderProps.orientation === 'vertical' ? undefined : '16rem',
          height: sliderProps.orientation === 'vertical' ? '12rem' : undefined,
        }}
      >
        <Slider
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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => <Demo variant={variant} />),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => <Demo color={color} />),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} />),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => <Demo radius={radius} />),
    },
    {
      title: 'Range',
      items: [
        <Demo initialValue={[20, 80]} />,
        <Demo initialValue={[10, 50, 90]} />,
      ],
    },
    {
      title: 'State',
      items: [
        <Demo initialValue={[50]} />,
        <Demo initialValue={[50]} disabled />,
        <Demo initialValue={[20, 80]} disabled />,
      ],
    },
  ],
});

export const Playground: Story = {};
