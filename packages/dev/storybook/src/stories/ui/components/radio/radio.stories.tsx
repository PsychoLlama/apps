import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, splitProps, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import { Radio, type RadioProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;

const Demo = (props: Partial<RadioProps> & { initialChecked?: boolean }) => {
  const [checked, setChecked] = createSignal(
    untrack(() => props.initialChecked ?? true),
  );
  return (
    <Radio
      testId="overview"
      {...props}
      checked={checked()}
      onCheckedChange={setChecked}
    />
  );
};

interface RadioArgs extends RadioProps {
  /** Initial controlled value the wrapper starts with. */
  initialChecked?: boolean;
}

const meta = {
  title: 'UI/Components/Radio',
  component: Radio,
  args: {
    testId: 'radio',
    size: 2,
    variant: 'surface',
    color: 'accent',
    initialChecked: false,
    disabled: false,
    // `checked` is required on RadioProps, but the wrapper drives the
    // value from `initialChecked`. Seeded here only to satisfy the type
    // — hidden from the controls panel via argTypes below so it doesn't
    // surface as a fake toggle.
    checked: false,
    onCheckedChange: fn(),
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    size: {
      control: { type: 'range', min: 1, max: 3, step: 1 },
    },
    variant: {
      control: 'inline-radio',
      options: ['classic', 'surface', 'soft'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral', 'danger', 'warning', 'success'],
    },
    initialChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    checked: { table: { disable: true } },
    onCheckedChange: { table: { disable: true } },
  },
  render: (args: RadioArgs) => {
    const [storyOnly, radioProps] = splitProps(args, [
      'initialChecked',
      'checked',
      'onCheckedChange',
    ]);
    const [checked, setChecked] = createSignal(
      untrack(() => storyOnly.initialChecked ?? false),
    );
    return (
      <Radio
        {...radioProps}
        checked={checked()}
        onCheckedChange={(next) => {
          storyOnly.onCheckedChange(next);
          setChecked(next);
        }}
      />
    );
  },
} satisfies Meta<RadioArgs>;

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
      title: 'State',
      items: [
        <Demo initialChecked={false} />,
        <Demo initialChecked={true} />,
        <Demo initialChecked={false} disabled />,
        <Demo initialChecked={true} disabled />,
      ],
    },
  ],
});

export const Playground: Story = {};
