import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { untrack } from 'solid-js';
import { createTestBindings, defineAction, defineStore } from '@lib/state';
import { Tabs, type TabsListProps, type TabsRootProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { testIdArgTypes } from '@lib/ui/props/test-id';

interface TabsArgs extends TabsRootProps, TabsListProps {}

const valueStore = defineStore<{ value: string }>(() => ({ value: '' }));
const setStoreValue = defineAction([valueStore], (state, next: string) => {
  state.value = next;
});

const useTabsHarness = (initial: string) => {
  const bindings = createTestBindings();
  const state = bindings.createStore(valueStore);
  const setValue = bindings.useAction(setStoreValue);
  setValue(initial);
  return { state, setValue };
};

const meta = {
  title: 'UI/Components',
  component: Tabs.Root,
  args: {
    value: 'overview',
    onValueChange: () => {},
    orientation: 'horizontal',
    activationMode: 'automatic',
    loop: true,
    size: 2,
    color: 'accent',
    highContrast: false,
    justify: 'start',
    wrap: 'nowrap',
  },
  argTypes: {
    ...marginArgTypes,
    ...testIdArgTypes,
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    activationMode: {
      control: 'inline-radio',
      options: ['automatic', 'manual'],
    },
    loop: { control: 'boolean' },
    size: {
      control: { type: 'range', min: 1, max: 2, step: 1 },
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral'],
    },
    highContrast: { control: 'boolean' },
    justify: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
    wrap: {
      control: 'inline-radio',
      options: ['nowrap', 'wrap', 'wrap-reverse'],
    },
  },
  render: (props: TabsArgs) => {
    const { state, setValue } = useTabsHarness(untrack(() => props.value));
    return (
      <Tabs.Root
        value={state.value}
        onValueChange={setValue}
        orientation={props.orientation}
        activationMode={props.activationMode}
        loop={props.loop}
      >
        <Tabs.List
          size={props.size}
          color={props.color}
          highContrast={props.highContrast}
          justify={props.justify}
          wrap={props.wrap}
        >
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
          <Tabs.Trigger value="analytics" disabled>
            Analytics
          </Tabs.Trigger>
          <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          The overview panel. Switch tabs with mouse, touch, or keyboard
          (arrows, Home, End).
        </Tabs.Content>
        <Tabs.Content value="settings">Settings panel.</Tabs.Content>
        <Tabs.Content value="analytics">
          You can't actually see this — Analytics is disabled in the trigger
          row.
        </Tabs.Content>
        <Tabs.Content value="billing">Billing panel.</Tabs.Content>
      </Tabs.Root>
    );
  },
} satisfies Meta<TabsArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tabs_: Story = { name: 'Tabs' };
