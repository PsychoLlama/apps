import {
  createUniqueId,
  mergeProps,
  splitProps,
  type JSX,
  type ParentComponent,
} from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import {
  TabsContext,
  type TabsActivationMode,
  type TabsContextValue,
} from './context';

/** `TabsRoot` props. Controlled — `value` and `onValueChange` are required. */
export interface TabsRootProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The active tab value. */
  value: string;
  /** Called when the user activates a different tab. */
  onValueChange: (value: string) => void;
  /**
   * `'automatic'` activates the tab on focus; `'manual'` requires Space or
   * Enter. @default 'automatic'
   */
  activationMode?: TabsActivationMode;
}

/** Container that owns the tabs context. */
export const TabsRoot: ParentComponent<TabsRootProps> = (rawProps) => {
  const props = mergeProps(
    {
      activationMode: 'automatic' as const,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'value',
    'onValueChange',
    'activationMode',
    'class',
    'children',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const baseId = createUniqueId();
  const ctx: TabsContextValue = {
    baseId,
    value: () => local.value,
    setValue: (next) => local.onValueChange(next),
    activationMode: () => local.activationMode,
    // `value` is consumer-supplied and may contain whitespace or other
    // characters that aren't valid in space-separated IDREF lists like
    // `aria-controls`. Percent-encode to keep IDs deterministic on both
    // sides (Trigger and Content) without a registration race.
    triggerId: (value) => `${baseId}-trigger-${encodeURIComponent(value)}`,
    contentId: (value) => `${baseId}-content-${encodeURIComponent(value)}`,
  };

  const className = () =>
    [...resolveMarginClasses(margin), skeletonClass(), local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <TabsContext.Provider value={ctx}>
      <div {...skeletonProps} class={className()} data-testid={tid.testId}>
        {local.children}
      </div>
    </TabsContext.Provider>
  );
};
