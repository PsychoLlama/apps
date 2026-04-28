/**
 * Internal contexts shared between Tabs.Root, .List, .Trigger, and .Content.
 *
 * Not exported from `@lib/ui` — consumers own the `value` signal in their
 * own scope and don't need a hook to read it back.
 *
 * The contexts are split across two boundaries:
 *
 * - `TabsContext` lives at the root and tracks selection (`value`) plus
 *   identity (`baseId`, ID minters). It's shared by every subcomponent.
 * - `TabsListContext` lives at each list and tracks the roving focus
 *   group: `loop` and a per-list registry of trigger DOM nodes. Splitting
 *   per-list keeps multiple `TabsList` siblings independent — each can set
 *   its own `loop`, and arrow keys never jump between lists.
 */

import { createContext, useContext, type Accessor } from 'solid-js';

export type TabsActivationMode = 'automatic' | 'manual';

/** Per-trigger registration. The Map itself is mutated imperatively; the
 * `disabled` accessor stays reactive so individual disabled-state flips
 * still propagate without a registry-level invalidation. */
export interface TabsTriggerRecord {
  el: HTMLButtonElement;
  disabled: () => boolean;
}

export interface TabsContextValue {
  baseId: string;
  value: Accessor<string>;
  setValue: (next: string) => void;
  activationMode: Accessor<TabsActivationMode>;
  triggerId: (value: string) => string;
  contentId: (value: string) => string;
}

export interface TabsListContextValue {
  loop: Accessor<boolean>;
  /**
   * Registry of mounted triggers, keyed by `value`. Mutated imperatively
   * via `registerTrigger`; consumers that need to react to registration
   * changes must subscribe to `version`.
   */
  triggers: Map<string, TabsTriggerRecord>;
  /** Bumps on every register/unregister. */
  version: Accessor<number>;
  /**
   * Add `record` under `value`. Returns a teardown that removes the
   * record if it's still the one stored under `value`. Both register and
   * unregister bump `version` so reactive consumers re-evaluate.
   */
  registerTrigger: (value: string, record: TabsTriggerRecord) => () => void;
}

export const TabsContext = createContext<TabsContextValue>();

export const useTabsContext = (): TabsContextValue => {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs subcomponent rendered outside of <TabsRoot>.');
  }
  return ctx;
};

export const TabsListContext = createContext<TabsListContextValue>();

export const useTabsListContext = (): TabsListContextValue => {
  const ctx = useContext(TabsListContext);
  if (!ctx) {
    throw new Error('<TabsTrigger> rendered outside of <TabsList>.');
  }
  return ctx;
};
