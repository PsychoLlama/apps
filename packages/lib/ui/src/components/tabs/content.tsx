import { splitProps, type JSX, type ParentComponent } from 'solid-js';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { useTabsContext } from './context';
import * as css from './tabs.css';

/** `TabsContent` props. Always renders a `<div role="tabpanel">`. */
export interface TabsContentProps
  extends RequiredTestIdProps, JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * Identifier matched against `TabsRoot`'s `value`. The panel always
   * mounts but is `hidden` while inactive.
   */
  value: string;
}

/**
 * Tab panel. Always rendered (so trigger `aria-controls` resolves), but
 * `hidden` while inactive. Children only render while active so consumer
 * effects don't run in the background.
 */
export const TabsContent: ParentComponent<TabsContentProps> = (rawProps) => {
  const ctx = useTabsContext();
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['value', 'class', 'children']);

  const isActive = () => ctx.value() === local.value;

  const className = () => [css.content, local.class].filter(Boolean).join(' ');

  return (
    <div
      {...rest}
      role="tabpanel"
      id={ctx.contentId(local.value)}
      aria-labelledby={ctx.triggerId(local.value)}
      tabIndex={0}
      hidden={!isActive()}
      class={className()}
      data-testid={tid.testId}
    >
      {isActive() && local.children}
    </div>
  );
};
