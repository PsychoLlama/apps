/**
 * Internal context shared between Tabs.Root, .List, .Trigger, and .Content.
 *
 * Not exported from `@lib/ui` — consumers own the `value` signal in their
 * own scope and don't need a hook to read it back.
 */

import { createContext, useContext, type Accessor } from 'solid-js';

export type TabsActivationMode = 'automatic' | 'manual';

/** Per-trigger registration kept in a mutable Map (intentionally not reactive). */
export interface TabsTriggerRecord {
  el: HTMLButtonElement;
  disabled: () => boolean;
}

export interface TabsContextValue {
  baseId: string;
  value: Accessor<string>;
  setValue: (next: string) => void;
  activationMode: Accessor<TabsActivationMode>;
  loop: Accessor<boolean>;
  triggers: Map<string, TabsTriggerRecord>;
  triggerId: (value: string) => string;
  contentId: (value: string) => string;
}

export const TabsContext = createContext<TabsContextValue>();

export const useTabsContext = (): TabsContextValue => {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs subcomponent rendered outside of <Tabs.Root>.');
  }
  return ctx;
};
