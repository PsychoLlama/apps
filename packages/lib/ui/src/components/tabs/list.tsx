import {
  mergeProps,
  splitProps,
  type JSX,
  type ParentComponent,
} from 'solid-js';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import {
  TabsListContext,
  useTabsContext,
  type TabsListContextValue,
} from './context';
import * as shared from './shared.css';

type TabsListSize = 1 | 2;
type TabsListColor = 'accent' | 'neutral';
type TabsListJustify = 'start' | 'center' | 'end';
type TabsListWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/** `TabsList` props. Visual configuration for the trigger row. */
export interface TabsListProps
  extends RequiredTestIdProps, JSX.HTMLAttributes<HTMLDivElement> {
  /** Visual size on a 1–2 scale. @default 2 */
  size?: TabsListSize;
  /** Indicator and active-text color. @default 'accent' */
  color?: TabsListColor;
  /** Use the strongest color step for the active indicator. @default false */
  highContrast?: boolean;
  /** Trigger alignment along the list axis. @default 'start' */
  justify?: TabsListJustify;
  /** Flex-wrap behavior. @default 'nowrap' */
  wrap?: TabsListWrap;
  /** Wrap focus around the ends of the list with arrow keys. @default true */
  loop?: boolean;
}

/** Container for `TabsTrigger` elements. Renders `<div role="tablist">`. */
export const TabsList: ParentComponent<TabsListProps> = (rawProps) => {
  // Subscribes to context just to enforce the "must be inside <TabsRoot>"
  // invariant; doesn't actually need the value.
  useTabsContext();
  const props = mergeProps(
    {
      size: 2 as const,
      color: 'accent' as const,
      highContrast: false,
      justify: 'start' as const,
      wrap: 'nowrap' as const,
      loop: true,
    },
    rawProps,
  );
  const [tid, withoutTid] = splitProps(props, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'color',
    'highContrast',
    'justify',
    'wrap',
    'loop',
    'class',
    'children',
  ]);

  const contrast = () => (local.highContrast ? 'high' : 'normal');

  const className = () =>
    [
      shared.list,
      shared.size[local.size],
      shared.justify[local.justify],
      shared.wrap[local.wrap],
      shared.color[local.color][contrast()],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const listCtx: TabsListContextValue = {
    loop: () => local.loop,
    triggers: new Map(),
  };

  return (
    <TabsListContext.Provider value={listCtx}>
      <div
        {...rest}
        role="tablist"
        aria-orientation="horizontal"
        class={className()}
        data-testid={tid.testId}
      >
        {local.children}
      </div>
    </TabsListContext.Provider>
  );
};
