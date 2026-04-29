import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { splitProps, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import { createTestBindings, defineAction, defineStore } from '@lib/state';
import { Switch, type SwitchProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';

interface SwitchArgs extends SwitchProps {
  /** Initial controlled value the wrapper starts with. */
  initialChecked?: boolean;
}

const checkedStore = defineStore<{ checked: boolean }>(() => ({
  checked: false,
}));
const setStoreChecked = defineAction([checkedStore], (state, next: boolean) => {
  state.checked = next;
});

const useSwitchHarness = (initial: boolean) => {
  const bindings = createTestBindings();
  const state = bindings.createStore(checkedStore);
  const setChecked = bindings.useAction(setStoreChecked);
  setChecked(initial);
  return { state, setChecked };
};

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
    // The wrapper owns `checked`; this seed only exists to satisfy
    // SwitchProps' required type. Render uses `initialChecked`.
    checked: false,
    onCheckedChange: fn(),
  },
  argTypes: {
    ...marginArgTypes,
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
  },
  render: (args: SwitchArgs) => {
    const [storyOnly, switchProps] = splitProps(args, [
      'initialChecked',
      'checked',
      'onCheckedChange',
    ]);
    const { state, setChecked } = useSwitchHarness(
      untrack(() => storyOnly.initialChecked ?? false),
    );
    return (
      <Switch
        {...switchProps}
        checked={state.checked}
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
