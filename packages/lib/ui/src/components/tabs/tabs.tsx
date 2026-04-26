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
 * - Inactive panels are unmounted via `<Show>`. No `forceMount`.
 * - No `data-state` / `data-orientation` / `data-disabled` attributes —
 *   internal styling uses VE class variants. No public context hook;
 *   consumers drive their own animations from the same `value` signal.
 * - No PageUp/PageDown keyboard handling. No RTL (`dir`) support.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tabs
 */

import {
  createEffect,
  createMemo,
  createUniqueId,
  mergeProps,
  onCleanup,
  Show,
  splitProps,
  type JSX,
  type ParentComponent,
} from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import {
  TabsContext,
  useTabsContext,
  type TabsActivationMode,
  type TabsContextValue,
  type TabsOrientation,
  type TabsTriggerRecord,
} from './context';
import * as shared from './shared.css';
import * as css from './tabs.css';

// --- Root ---

/** `Tabs.Root` props. Controlled — `value` and `onValueChange` are required. */
export interface TabsRootProps extends MarginProps, TestIdProps {
  /** The active tab value. */
  value: string;
  /** Called when the user activates a different tab. */
  onValueChange: (value: string) => void;
  /** Tab orientation. Affects keyboard navigation and visual layout. @default 'horizontal' */
  orientation?: TabsOrientation;
  /**
   * `'automatic'` activates the tab on focus; `'manual'` requires Space or
   * Enter. @default 'automatic'
   */
  activationMode?: TabsActivationMode;
  /** Wrap focus around the ends of the list with arrow keys. @default true */
  loop?: boolean;
  /** Additional class for the root element. */
  class?: string;
  /** Tab list and panel(s). */
  children?: JSX.Element;
}

/** Container that owns the tabs context. */
export const TabsRoot: ParentComponent<TabsRootProps> = (rawProps) => {
  const props = mergeProps(
    {
      orientation: 'horizontal' as const,
      activationMode: 'automatic' as const,
      loop: true,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local] = splitProps(withoutTid, [
    'value',
    'onValueChange',
    'orientation',
    'activationMode',
    'loop',
    'class',
    'children',
  ]);

  const baseId = createUniqueId();
  const ctx: TabsContextValue = {
    baseId,
    value: () => local.value,
    setValue: (next) => local.onValueChange(next),
    orientation: () => local.orientation,
    activationMode: () => local.activationMode,
    loop: () => local.loop,
    triggers: new Map(),
    // `value` is consumer-supplied and may contain whitespace or other
    // characters that aren't valid in space-separated IDREF lists like
    // `aria-controls`. Percent-encode to keep IDs deterministic on both
    // sides (Trigger and Content) without a registration race.
    triggerId: (value) => `${baseId}-trigger-${encodeURIComponent(value)}`,
    contentId: (value) => `${baseId}-content-${encodeURIComponent(value)}`,
  };

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      local.orientation === 'vertical' && css.rootVertical,
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <TabsContext.Provider value={ctx}>
      <div class={className()} data-testid={tid.testId}>
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

/** `Tabs.List` props. Visual configuration for the trigger row. */
export interface TabsListProps extends TestIdProps {
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
  /** Additional class for the list element. */
  class?: string;
  /** Triggers. */
  children?: JSX.Element;
}

/** Container for `Tabs.Trigger` elements. Renders `<div role="tablist">`. */
export const TabsList: ParentComponent<TabsListProps> = (rawProps) => {
  const ctx = useTabsContext();
  const props = mergeProps(
    {
      size: 2 as const,
      color: 'accent' as const,
      highContrast: false,
      justify: 'start' as const,
      wrap: 'nowrap' as const,
    },
    rawProps,
  );
  const [tid, withoutTid] = splitProps(props, [...testIdPropKeys]);
  const [local] = splitProps(withoutTid, [
    'size',
    'color',
    'highContrast',
    'justify',
    'wrap',
    'class',
    'children',
  ]);

  const contrast = () => (local.highContrast ? 'high' : 'normal');

  const className = () =>
    [
      shared.list,
      ctx.orientation() === 'vertical' && css.listVertical,
      shared.size[local.size],
      shared.justify[local.justify],
      shared.wrap[local.wrap],
      shared.color[local.color][contrast()],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div
      role="tablist"
      aria-orientation={ctx.orientation()}
      class={className()}
      data-testid={tid.testId}
    >
      {local.children}
    </div>
  );
};

// --- Trigger ---

/** `Tabs.Trigger` props. Always renders a `<button>`. */
export interface TabsTriggerProps extends TestIdProps {
  /** Identifier matched against `Tabs.Root`'s `value`. */
  value: string;
  /** Disable the trigger. Skipped during keyboard navigation. */
  disabled?: boolean;
  /** Additional class for the button. */
  class?: string;
  /** Trigger label. Rendered twice (visible + width-reservation) via the dual-span trick. */
  children?: JSX.Element;
}

/** A single tab control. Renders `<button role="tab">`. */
export const TabsTrigger: ParentComponent<TabsTriggerProps> = (rawProps) => {
  const ctx = useTabsContext();
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local] = splitProps(withoutTid, [
    'value',
    'disabled',
    'class',
    'children',
  ]);

  const isActive = () => ctx.value() === local.value;
  const isDisabled = () => local.disabled === true;

  // Active wins; otherwise the first enabled trigger gets the roving
  // `tabindex=0` so Tab into the list never lands on a disabled control.
  const isFocusableTarget = createMemo(() => {
    if (isActive() && !isDisabled()) return true;
    const active = ctx.triggers.get(ctx.value());
    if (active && !active.disabled()) return false;
    if (isDisabled()) return false;
    const firstEnabled = firstEnabledTrigger(ctx.triggers);
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
    ctx.triggers.set(currentValue, record);
    onCleanup(() => {
      if (ctx.triggers.get(currentValue) === record) {
        ctx.triggers.delete(currentValue);
      }
    });
  });

  const onClick = () => {
    if (isDisabled()) return;
    ctx.setValue(local.value);
  };

  const onFocus = () => {
    if (isDisabled()) return;
    if (ctx.activationMode() === 'automatic' && !isActive()) {
      ctx.setValue(local.value);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return;

    const orientation = ctx.orientation();
    const isHorizontal = orientation === 'horizontal';
    const next = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prev = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    if (event.key === ' ' || event.key === 'Enter') {
      if (isDisabled()) return;
      event.preventDefault();
      ctx.setValue(local.value);
      return;
    }

    let target: string | undefined;
    if (event.key === next) {
      target = neighbor(ctx, local.value, 1);
    } else if (event.key === prev) {
      target = neighbor(ctx, local.value, -1);
    } else if (event.key === 'Home') {
      target = firstEnabledTrigger(ctx.triggers);
    } else if (event.key === 'End') {
      target = lastEnabledTrigger(ctx.triggers);
    } else {
      return;
    }

    if (!target) return;
    event.preventDefault();
    const record = ctx.triggers.get(target);
    record?.el.focus();
  };

  const className = () =>
    [shared.trigger, isActive() && shared.triggerActive, local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <button
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
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      <span class={shared.triggerInner}>{local.children}</span>
      <span aria-hidden="true" class={shared.triggerInnerHidden}>
        {local.children}
      </span>
    </button>
  );
};

// --- Content ---

/** `Tabs.Content` props. Always renders a `<div role="tabpanel">`. */
export interface TabsContentProps
  extends TestIdProps, JSX.HTMLAttributes<HTMLDivElement> {
  /** Identifier matched against `Tabs.Root`'s `value`. Only the active panel renders. */
  value: string;
}

/**
 * Tab panel. Renders only while active (`<Show>`-gated). The active panel
 * always carries `tabIndex={0}` so screen-reader users can Tab into it.
 */
export const TabsContent: ParentComponent<TabsContentProps> = (rawProps) => {
  const ctx = useTabsContext();
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, ['value', 'class', 'children']);

  const isActive = () => ctx.value() === local.value;

  const className = () => [css.content, local.class].filter(Boolean).join(' ');

  return (
    <Show when={isActive()}>
      <div
        role="tabpanel"
        id={ctx.contentId(local.value)}
        aria-labelledby={ctx.triggerId(local.value)}
        tabIndex={0}
        class={className()}
        data-testid={tid.testId}
        {...rest}
      >
        {local.children}
      </div>
    </Show>
  );
};

// --- Helpers ---

const orderedValues = (triggers: Map<string, TabsTriggerRecord>): string[] => {
  // Map preserves insertion order; triggers register in mount order, which
  // for static JSX matches DOM order. Re-sort by DOM position to stay
  // correct when triggers are conditionally rendered.
  const entries = Array.from(triggers.entries());
  entries.sort((left, right) => {
    const cmp = left[1].el.compareDocumentPosition(right[1].el);
    if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
  return entries.map(([value]) => value);
};

const neighbor = (
  ctx: TabsContextValue,
  from: string,
  step: 1 | -1,
): string | undefined => {
  const order = orderedValues(ctx.triggers);
  if (order.length === 0) return undefined;
  const startIdx = order.indexOf(from);
  if (startIdx === -1) return undefined;
  const len = order.length;
  for (let offset = 1; offset <= len; offset++) {
    const rawIdx = startIdx + step * offset;
    if (!ctx.loop() && (rawIdx < 0 || rawIdx >= len)) return undefined;
    const idx = ((rawIdx % len) + len) % len;
    const value = order[idx];
    const record = ctx.triggers.get(value);
    if (record && !record.disabled()) return value;
  }
  return undefined;
};

const firstEnabledTrigger = (
  triggers: Map<string, TabsTriggerRecord>,
): string | undefined => {
  for (const value of orderedValues(triggers)) {
    const record = triggers.get(value);
    if (record && !record.disabled()) return value;
  }
  return undefined;
};

const lastEnabledTrigger = (
  triggers: Map<string, TabsTriggerRecord>,
): string | undefined => {
  const order = orderedValues(triggers);
  for (let idx = order.length - 1; idx >= 0; idx--) {
    const value = order[idx];
    const record = triggers.get(value);
    if (record && !record.disabled()) return value;
  }
  return undefined;
};
