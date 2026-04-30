import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, splitProps, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import { Switch, type SwitchProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';

interface SwitchArgs extends SwitchProps {
  /** Initial controlled value the wrapper starts with. */
  initialChecked?: boolean;
}

const meta = {
  title: 'UI/Components',
  component: Switch,
  args: {
    testId: 'switch',
    size: 2,
    variant: 'surface',
    radius: 'full',
    color: 'accent',
    initialChecked: false,
    disabled: false,
    // `checked` is required on SwitchProps, but the wrapper drives the
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
    radius: {
      control: 'inline-radio',
      options: ['none', 'small', 'medium', 'large', 'full'],
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
  render: (args: SwitchArgs) => {
    const [storyOnly, switchProps] = splitProps(args, [
      'initialChecked',
      'checked',
      'onCheckedChange',
    ]);
    const [checked, setChecked] = createSignal(
      untrack(() => storyOnly.initialChecked ?? false),
    );
    return (
      <Switch
        {...switchProps}
        checked={checked()}
        onCheckedChange={(next) => {
          storyOnly.onCheckedChange(next);
          setChecked(next);
        }}
      />
    );
  },
} satisfies Meta<SwitchArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Switch_: Story = { name: 'Switch' };
