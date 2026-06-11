import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createEffect, createSignal, splitProps, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import {
  Checkbox,
  Flex,
  Text,
  type CheckboxChecked,
  type CheckboxProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;

const Demo = (
  props: Partial<CheckboxProps> & { initialChecked?: CheckboxChecked },
) => {
  const [checked, setChecked] = createSignal<CheckboxChecked>(
    untrack(() => props.initialChecked ?? true),
  );
  return (
    <Checkbox
      testId="overview"
      {...props}
      checked={checked()}
      onCheckedChange={setChecked}
    />
  );
};

// Mismatched checkbox/text sizes — a small checkbox inside larger-text
// copy is the case that surfaces the line-height tracking. With
// matched sizes the box height already equals the text's line-height,
// so the fix is invisible there.
const WrappingDemo = (props: {
  id: string;
  checkboxSize: 1 | 2 | 3;
  textSize: 4 | 5 | 6;
}) => {
  const [checked, setChecked] = createSignal(true);
  return (
    <Text
      as="label"
      size={props.textSize}
      selectable
      style={{ width: '16rem' }}
    >
      <Flex as="div" gap={2}>
        <Checkbox
          testId={`overview-wrap-${props.id}`}
          size={props.checkboxSize}
          checked={checked()}
          onCheckedChange={setChecked}
        />
        A longer label that wraps across two or three lines so the checkbox
        stays aligned with the first line of text.
      </Flex>
    </Text>
  );
};

interface CheckboxArgs extends CheckboxProps {
  /** Initial controlled value the wrapper starts with. */
  initialChecked?: CheckboxChecked;
}

const meta = {
  title: 'UI/Components/Checkbox',
  component: Checkbox,
  args: {
    testId: 'checkbox',
    size: 2,
    variant: 'surface',
    color: 'accent',
    initialChecked: false,
    disabled: false,
    // `checked` is required on CheckboxProps, but the wrapper drives
    // the value from `initialChecked`. Seeded here only to satisfy the
    // type — hidden from the controls panel via argTypes below so it
    // doesn't surface as a fake toggle.
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
    initialChecked: {
      control: 'inline-radio',
      options: [false, true, 'indeterminate'],
    },
    disabled: { control: 'boolean' },
    checked: { table: { disable: true } },
    onCheckedChange: { table: { disable: true } },
  },
  render: (args: CheckboxArgs) => {
    const [storyOnly, checkboxProps] = splitProps(args, [
      'initialChecked',
      'checked',
      'onCheckedChange',
    ]);
    const [checked, setChecked] = createSignal<CheckboxChecked>(
      storyOnly.initialChecked ?? false,
    );
    // Re-seed the signal whenever the controls panel's `initialChecked`
    // changes so the tri-state is reachable from the Playground. Without
    // the effect, the args panel update would be absorbed silently —
    // the local signal only gets read on first render.
    createEffect(() => setChecked(storyOnly.initialChecked ?? false));
    return (
      <Checkbox
        {...checkboxProps}
        checked={checked()}
        onCheckedChange={(next) => {
          storyOnly.onCheckedChange(next);
          setChecked(next);
        }}
      />
    );
  },
} satisfies Meta<CheckboxArgs>;

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
        <Demo initialChecked="indeterminate" />,
        <Demo initialChecked={false} disabled />,
        <Demo initialChecked={true} disabled />,
        <Demo initialChecked="indeterminate" disabled />,
      ],
    },
    {
      title: 'With label',
      items: [
        <Demo initialChecked={true}>Subscribe to updates</Demo>,
        <Demo initialChecked="indeterminate">Some items selected</Demo>,
        <Demo initialChecked={false} disabled>
          Disabled option
        </Demo>,
      ],
    },
    {
      title: 'Wrapping labels',
      items: SIZES.map((checkboxSize, index) => {
        const textSize = (4 + index) as 4 | 5 | 6;
        return (
          <WrappingDemo
            id={`checkbox-${checkboxSize}-text-${textSize}`}
            checkboxSize={checkboxSize}
            textSize={textSize}
          />
        );
      }),
    },
  ],
});

export const Playground: Story = {};
