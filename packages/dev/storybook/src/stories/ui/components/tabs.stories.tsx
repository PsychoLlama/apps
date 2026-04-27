import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { untrack } from 'solid-js';
import { expect, userEvent, within } from 'storybook/test';
import { createTestBindings, defineAction, defineStore } from '@lib/state';
import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  type TabsListProps,
  type TabsRootProps,
} from '@lib/ui';
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
  component: TabsRoot,
  args: {
    testId: 'tabs',
    value: 'overview',
    onValueChange: () => {},
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
      <TabsRoot
        testId={props.testId}
        value={state.value}
        onValueChange={setValue}
        activationMode={props.activationMode}
      >
        <TabsList
          testId={`${props.testId}-list`}
          size={props.size}
          color={props.color}
          highContrast={props.highContrast}
          justify={props.justify}
          wrap={props.wrap}
          loop={props.loop}
        >
          <TabsTrigger
            testId={`${props.testId}-trigger-overview`}
            value="overview"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            testId={`${props.testId}-trigger-settings`}
            value="settings"
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            testId={`${props.testId}-trigger-analytics`}
            value="analytics"
            disabled
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            testId={`${props.testId}-trigger-billing`}
            value="billing"
          >
            Billing
          </TabsTrigger>
        </TabsList>
        <TabsContent
          testId={`${props.testId}-content-overview`}
          value="overview"
        >
          The overview panel. Switch tabs with mouse, touch, or keyboard
          (arrows, Home, End).
        </TabsContent>
        <TabsContent
          testId={`${props.testId}-content-settings`}
          value="settings"
        >
          Settings panel.
        </TabsContent>
        <TabsContent
          testId={`${props.testId}-content-analytics`}
          value="analytics"
        >
          You can't actually see this — Analytics is disabled in the trigger
          row.
        </TabsContent>
        <TabsContent testId={`${props.testId}-content-billing`} value="billing">
          Billing panel.
        </TabsContent>
      </TabsRoot>
    );
  },
} satisfies Meta<TabsArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default Tabs. Play function exercises mouse activation, keyboard
 * navigation (arrows, Home/End, PageUp/PageDown), looping, skip-disabled,
 * and the mousedown right-click / ctrl-click filter — everything that
 * needs real browser focus + event semantics rather than JSDOM
 * approximations.
 */
export const Tabs: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    const overview = canvas.getByTestId('tabs-trigger-overview');
    const settings = canvas.getByTestId('tabs-trigger-settings');
    const billing = canvas.getByTestId('tabs-trigger-billing');

    // --- mouse activation ---
    await userEvent.click(settings);
    await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();

    // --- right-click does NOT activate ---
    await userEvent.click(overview);
    await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();
    settings.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 2 }),
    );
    await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();

    // --- ctrl+click does NOT activate (macOS context menu) ---
    settings.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        button: 0,
        ctrlKey: true,
      }),
    );
    await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();

    // --- ArrowRight: skip disabled, automatic activation ---
    overview.focus();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(settings).toHaveFocus();
    await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();
    await userEvent.keyboard('{ArrowRight}');
    // Analytics is disabled — focus jumps past it to Billing
    await expect(billing).toHaveFocus();
    await expect(canvas.getByTestId('tabs-content-billing')).toBeVisible();

    // --- loop wraps from last to first ---
    await userEvent.keyboard('{ArrowRight}');
    await expect(overview).toHaveFocus();

    // --- Home / End ---
    await userEvent.keyboard('{End}');
    await expect(billing).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(overview).toHaveFocus();

    // --- PageDown / PageUp mirror End / Home ---
    await userEvent.keyboard('{PageDown}');
    await expect(billing).toHaveFocus();
    await userEvent.keyboard('{PageUp}');
    await expect(overview).toHaveFocus();
  },
};

/**
 * Manual activation mode. Arrow keys move focus only; the consumer must
 * press Space or Enter to activate the focused tab.
 */
export const TabsManualActivation: Story = {
  args: { activationMode: 'manual' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByTestId('tabs-trigger-overview');
    const settings = canvas.getByTestId('tabs-trigger-settings');

    overview.focus();
    await userEvent.keyboard('{ArrowRight}');
    // Focus moved...
    await expect(settings).toHaveFocus();
    // ...but Overview's panel is still the active one.
    await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();

    // Space activates.
    await userEvent.keyboard(' ');
    await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();
  },
};

/**
 * `loop=false`. Arrow navigation stops at the boundary instead of
 * wrapping around.
 */
export const TabsNoLoop: Story = {
  args: { loop: false },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const billing = canvas.getByTestId('tabs-trigger-billing');

    billing.focus();
    await userEvent.keyboard('{ArrowRight}');
    // Should stay on billing — no wrap.
    await expect(billing).toHaveFocus();
  },
};
