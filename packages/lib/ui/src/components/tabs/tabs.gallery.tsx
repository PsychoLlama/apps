import type { Listing } from '#gallery';
import { createSignal } from 'solid-js';
import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  type TabsListProps,
} from './tabs';

const Demo = (props: Partial<TabsListProps>) => {
  const [value, setValue] = createSignal('overview');
  return (
    <TabsRoot value={value()} onValueChange={setValue} testId="tabs">
      <TabsList
        size={props.size}
        color={props.color}
        highContrast={props.highContrast}
        testId="tabs-list"
      >
        <TabsTrigger value="overview" testId="tabs-trigger-overview">
          Overview
        </TabsTrigger>
        <TabsTrigger value="settings" testId="tabs-trigger-settings">
          Settings
        </TabsTrigger>
        <TabsTrigger value="billing" testId="tabs-trigger-billing">
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" testId="tabs-content-overview" />
      <TabsContent value="settings" testId="tabs-content-settings" />
      <TabsContent value="billing" testId="tabs-content-billing" />
    </TabsRoot>
  );
};

/**
 * Gallery listing for `Tabs`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Tabs',
  group: 'navigation',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
      ],
    },
    {
      title: 'High contrast',
      columns: [
        { title: 'Accent', props: { color: 'accent', highContrast: true } },
        { title: 'Neutral', props: { color: 'neutral', highContrast: true } },
      ],
    },
  ],
} satisfies Listing<TabsListProps>;
