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
 * - No `data-state` / `data-disabled` attributes — internal styling uses
 *   VE class variants. No public context hook; consumers drive their own
 *   animations from the same `value` signal.
 * - Horizontal-only. No vertical layout, no PageUp/PageDown asymmetry.
 *   No RTL (`dir`) support.
 * - No CSS transitions on the active/inactive switch — color and indicator
 *   flip instantly.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tabs
 */

import {
  createEffect,
  createMemo,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
  type JSX,
  type ParentComponent,
} from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { callConsumerHandler } from '../compose-event-handler';
import {
  TabsContext,
  TabsListContext,
  useTabsContext,
  useTabsListContext,
  type TabsActivationMode,
  type TabsContextValue,
  type TabsListContextValue,
  type TabsTriggerRecord,
} from './context';
import * as shared from './shared.css';
import * as css from './tabs.css';

// --- Root ---

/** `TabsRoot` props. Controlled — `value` and `onValueChange` are required. */
export interface TabsRootProps
  extends
    MarginProps,
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
  ]);

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
    [...resolveMarginClasses(margin), local.class].filter(Boolean).join(' ');

  return (
    <TabsContext.Provider value={ctx}>
      <div {...rest} class={className()} data-testid={tid.testId}>
        {local.children}
      </div>
    </TabsContext.Provider>
  );
};

// --- List ---

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

// --- Trigger ---

/** `TabsTrigger` props. Always renders a `<button>`. */
export interface TabsTriggerProps
  extends RequiredTestIdProps, JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Identifier matched against `TabsRoot`'s `value`. */
  value: string;
  /** Disable the trigger. Skipped during keyboard navigation. */
  disabled?: boolean;
}

/** A single tab control. Renders `<button role="tab">`. */
export const TabsTrigger: ParentComponent<TabsTriggerProps> = (rawProps) => {
  const ctx = useTabsContext();
  const listCtx = useTabsListContext();
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'value',
    'disabled',
    'class',
    'children',
    'onMouseDown',
    'onKeyDown',
    'onFocus',
  ]);

  const isActive = () => ctx.value() === local.value;
  const isDisabled = () => local.disabled === true;

  // Active wins; otherwise the first enabled trigger gets the roving
  // `tabindex=0` so Tab into the list never lands on a disabled control.
  const isFocusableTarget = createMemo(() => {
    if (isActive() && !isDisabled()) return true;
    const active = listCtx.triggers.get(ctx.value());
    if (active && !active.disabled()) return false;
    if (isDisabled()) return false;
    const firstEnabled = firstEnabledTrigger(listCtx.triggers);
    return firstEnabled === local.value;
  });

  let buttonRef: HTMLButtonElement | undefined;

  // `createEffect` (not `onMount`) so that re-using the same trigger
  // instance with a different `value` re-keys the registry under the
  // new value and cleans up the old key.
  createEffect(() => {
    if (!buttonRef) return;
    const currentValue = local.value;
    const record: TabsTriggerRecord = {
      el: buttonRef,
      disabled: isDisabled,
    };
    listCtx.triggers.set(currentValue, record);
    onCleanup(() => {
      if (listCtx.triggers.get(currentValue) === record) {
        listCtx.triggers.delete(currentValue);
      }
    });
  });

  const onMouseDown: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (
    event,
  ) => {
    callConsumerHandler(local.onMouseDown, event);
    if (event.defaultPrevented) return;
    if (isDisabled()) return;
    // Match Radix: only activate on a plain left-click. Right-click and
    // ctrl-click (macOS context menu) preventDefault to avoid stealing
    // focus, which would otherwise activate the tab in `automatic` mode.
    if (event.button === 0 && !event.ctrlKey) {
      ctx.setValue(local.value);
    } else {
      event.preventDefault();
    }
  };

  const onFocus: JSX.EventHandler<HTMLButtonElement, FocusEvent> = (event) => {
    callConsumerHandler(local.onFocus, event);
    if (event.defaultPrevented) return;
    if (isDisabled()) return;
    if (ctx.activationMode() === 'automatic' && !isActive()) {
      ctx.setValue(local.value);
    }
  };

  const onKeyDown: JSX.EventHandler<HTMLButtonElement, KeyboardEvent> = (
    event,
  ) => {
    callConsumerHandler(local.onKeyDown, event);
    if (event.defaultPrevented) return;

    if (event.key === ' ' || event.key === 'Enter') {
      if (isDisabled()) return;
      event.preventDefault();
      ctx.setValue(local.value);
      return;
    }

    let target: string | undefined;
    if (event.key === 'ArrowRight') {
      target = neighbor(listCtx, local.value, 1);
    } else if (event.key === 'ArrowLeft') {
      target = neighbor(listCtx, local.value, -1);
    } else if (event.key === 'Home' || event.key === 'PageUp') {
      target = firstEnabledTrigger(listCtx.triggers);
    } else if (event.key === 'End' || event.key === 'PageDown') {
      target = lastEnabledTrigger(listCtx.triggers);
    } else {
      return;
    }

    if (!target) return;
    event.preventDefault();
    const record = listCtx.triggers.get(target);
    record?.el.focus();
  };

  const className = () =>
    [shared.trigger, isActive() && shared.triggerActive, local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <button
      {...rest}
      type="button"
      role="tab"
      ref={(el) => {
        buttonRef = el;
      }}
      id={ctx.triggerId(local.value)}
      aria-controls={ctx.contentId(local.value)}
      aria-selected={isActive()}
      tabIndex={isFocusableTarget() ? 0 : -1}
      disabled={local.disabled}
      class={className()}
      data-testid={tid.testId}
      onMouseDown={onMouseDown}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      <span class={shared.triggerInner}>{local.children}</span>
    </button>
  );
};

// --- Content ---

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

// --- Helpers ---

type Triggers = Map<string, TabsTriggerRecord>;

const isEnabled = (triggers: Triggers, value: string): boolean =>
  triggers.get(value)?.disabled() === false;

/**
 * Trigger values in DOM order. Map insertion order matches mount order,
 * which matches DOM order for static JSX — but conditional triggers can
 * mount out of order, so re-sort by DOM position.
 */
const orderedValues = (triggers: Triggers): string[] =>
  [...triggers.entries()]
    .sort(([, left], [, right]) =>
      left.el.compareDocumentPosition(right.el) &
      Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    )
    .map(([value]) => value);

const firstEnabledTrigger = (triggers: Triggers): string | undefined =>
  orderedValues(triggers).find((value) => isEnabled(triggers, value));

const lastEnabledTrigger = (triggers: Triggers): string | undefined =>
  orderedValues(triggers).findLast((value) => isEnabled(triggers, value));

const neighbor = (
  listCtx: TabsListContextValue,
  from: string,
  step: 1 | -1,
): string | undefined => {
  const order = orderedValues(listCtx.triggers);
  const start = order.indexOf(from);
  if (start === -1) return undefined;
  const enabled = (value: string) => isEnabled(listCtx.triggers, value);

  const forward =
    step === 1 ? order.slice(start + 1) : order.slice(0, start).reverse();
  const next = forward.find(enabled);
  if (next || !listCtx.loop()) return next;

  const wrap =
    step === 1 ? order.slice(0, start) : order.slice(start + 1).reverse();
  return wrap.find(enabled);
};
