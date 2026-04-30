/**
 * Tabs component.
 *
 * Ported from Radix UI Themes Tabs (which wraps the Tabs primitive).
 * Exported as four flat components — `TabsRoot`, `TabsList`, `TabsTrigger`,
 * `TabsContent` — composed by the consumer.
 *
 * Deviations from Radix:
 * - Fully controlled — `value` and `onValueChange` are required. No
 *   internal signal, no `defaultValue`. Consumers own the source of truth.
 * - Accent and neutral palettes only.
 * - Inactive panels stay mounted with `hidden` (matching Radix), but their
 *   children only render while active so consumer effects don't run in the
 *   background. No `forceMount`.
 * - `data-state="active" | "inactive"` is exposed on `TabsTrigger` and
 *   `TabsContent` so consumers can drive CSS-only state styling — active
 *   panel animations, `view-transition-name`, custom indicators — without
 *   threading the `value` signal through their styling layer. Internal
 *   styling still uses VE class variants. No `data-disabled` (the native
 *   `[disabled]` selector on `<button>` already covers that case) and no
 *   public context hook.
 * - Horizontal-only. No vertical layout, no PageUp/PageDown asymmetry.
 *   No RTL (`dir`) support.
 * - No CSS transitions on the active/inactive switch — color and indicator
 *   flip instantly.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tabs
 */

export { TabsRoot, type TabsRootProps } from './root';
export { TabsList, type TabsListProps } from './list';
export { TabsTrigger, type TabsTriggerProps } from './trigger';
export { TabsContent, type TabsContentProps } from './content';
