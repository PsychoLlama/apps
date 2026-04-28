import {
  createEffect,
  createMemo,
  onCleanup,
  splitProps,
  type JSX,
  type ParentComponent,
} from 'solid-js';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { callConsumerHandler } from '../compose-event-handler';
import {
  useTabsContext,
  useTabsListContext,
  type TabsTriggerRecord,
} from './context';
import {
  firstEnabledTrigger,
  lastEnabledTrigger,
  neighbor,
} from './keyboard-nav';
import * as shared from './shared.css';

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
  // Reads `listCtx.version()` so that each new trigger registration
  // re-runs this memo — without it, a `value` that points at a disabled
  // (or not-yet-mounted) trigger would leave every trigger with
  // `tabindex=-1` permanently, since plain Map mutations aren't tracked.
  const isFocusableTarget = createMemo(() => {
    listCtx.version();
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
    const record: TabsTriggerRecord = {
      el: buttonRef,
      disabled: isDisabled,
    };
    onCleanup(listCtx.registerTrigger(local.value, record));
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
