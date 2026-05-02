import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { createSignal, untrack } from 'solid-js';
import { fn } from 'storybook/test';
import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  type TabsListProps,
  type TabsRootProps,
} from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

interface TabsArgs extends TabsRootProps, TabsListProps {}

const SIZES = [1, 2] as const;
const COLORS = ['accent', 'neutral'] as const;

const Demo = (props: Partial<TabsListProps> & { id: string }) => {
  const [value, setValue] = createSignal('overview');
  return (
    <TabsRoot
      testId={`overview-${props.id}`}
      value={value()}
      onValueChange={setValue}
    >
      <TabsList
        testId={`overview-${props.id}-list`}
        size={props.size}
        color={props.color}
        highContrast={props.highContrast}
      >
        <TabsTrigger
          testId={`overview-${props.id}-trigger-overview`}
          value="overview"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          testId={`overview-${props.id}-trigger-settings`}
          value="settings"
        >
          Settings
        </TabsTrigger>
        <TabsTrigger
          testId={`overview-${props.id}-trigger-billing`}
          value="billing"
        >
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent
        testId={`overview-${props.id}-content-overview`}
        value="overview"
      />
      <TabsContent
        testId={`overview-${props.id}-content-settings`}
        value="settings"
      />
      <TabsContent
        testId={`overview-${props.id}-content-billing`}
        value="billing"
      />
    </TabsRoot>
  );
};

const meta = {
  title: 'UI/Components/Tabs',
  component: TabsRoot,
  args: {
    testId: 'tabs',
    value: 'overview',
    onValueChange: fn(),
    activationMode: 'automatic',
    loop: true,
    size: 2,
    color: 'accent',
    highContrast: false,
    justify: 'start',
    wrap: 'nowrap',
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...skeletonArgTypes,
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
    const [value, setValue] = createSignal(untrack(() => props.value));
    return (
      <TabsRoot
        testId={props.testId}
        value={value()}
        onValueChange={(next) => {
          props.onValueChange(next);
          setValue(next);
        }}
        activationMode={props.activationMode}
        skeleton={props.skeleton}
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

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo id={`size-${size}`} size={size} />),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Demo id={`color-${color}`} color={color} />
      )),
    },
    {
      title: 'High contrast',
      items: COLORS.map((color) => (
        <Demo id={`hc-${color}`} color={color} highContrast />
      )),
    },
  ],
});

export const Playground: Story = {};
