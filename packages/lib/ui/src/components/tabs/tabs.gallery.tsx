import type { GalleryListing } from '@dev/gallery';
import { createSignal } from 'solid-js';
import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  type TabsListProps,
} from './tabs';

const COLORS = ['accent', 'neutral'] as const;

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
  sections: [
    {
      title: 'Color',
      items: COLORS.map((color) => <Demo color={color} />),
    },
    {
      title: 'High contrast',
      items: COLORS.map((color) => <Demo color={color} highContrast />),
    },
  ],
} satisfies GalleryListing;
