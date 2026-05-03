/**
 * RadioGroup component.
 *
 * Ported from Radix UI Themes RadioGroup (which wraps the RadioGroup
 * primitive). Exported as two flat components — `RadioGroupRoot` and
 * `RadioGroupItem` — composed by the consumer.
 *
 * Deviations from Radix:
 * - Implemented over native `<input type="radio">` for every item rather
 *   than the primitives' `<button role="radio">`. The browser handles
 *   arrow-key navigation, focus rotation, and form submission natively
 *   when items share a `name`, which removes the need for a roving-focus
 *   group, a hidden bubble input, or scoped contexts.
 * - Fully controlled — `value` and `onValueChange` are required. No
 *   `defaultValue`, no internal signal. The consumer owns the source
 *   of truth.
 * - Auto-generates a stable `name` if the consumer omits one so the
 *   browser still groups items into a single radio group. Pass `name`
 *   when the form needs a deterministic field key.
 * - Items render either a bare `<input>` or a `<Text as="label">`
 *   wrapping the input plus its inline children — the same fork Radix
 *   exposes, but tag-locked (no `as` / `asChild`).
 * - `color` accepts every semantic palette token. Drops `highContrast`
 *   (recorded as a deferred deviation) and the `responsive` size object.
 *
 * @see https://www.radix-ui.com/themes/docs/components/radio-group
 * @see https://www.radix-ui.com/primitives/docs/components/radio-group
 */

import { createUniqueId, mergeProps, Show, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import { type MarginProps } from '../../props/margin';
import { type SkeletonProps } from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { callConsumerHandler } from '../compose-event-handler';
import Flex from '../flex/flex';
import Text from '../text/text';
import {
  RadioGroupContext,
  useRadioGroupContext,
  type RadioGroupContextValue,
} from './context';
import {
  resolveRadioClasses,
  type RadioColor,
  type RadioSize,
  type RadioVariant,
} from './radio';
import * as css from './radio-group.css';

/**
 * `RadioGroupRoot` props. Renders a `<div role="radiogroup">` and
 * propagates shared configuration to every `RadioGroupItem` inside.
 */
export interface RadioGroupRootProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'role'> {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: RadioSize;
  /** Visual treatment. @default 'surface' */
  variant?: RadioVariant;
  /** Semantic color palette for the checked indicator. @default 'accent' */
  color?: RadioColor;
  /**
   * Layout axis. `vertical` stacks items in a column; `horizontal`
   * flows them in a row. Surfaces as `aria-orientation` on the
   * radiogroup. @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Form-submit name for every item. Auto-generated if omitted so the
   * browser still groups the items for native arrow-key navigation.
   */
  name?: string;
  /** Disable every item in the group. @default false */
  disabled?: boolean;
  /**
   * Mark the group as required for assistive technology. Surfaces as
   * `aria-required="true"` on the radiogroup and as the native
   * `required` attribute on every item.
   * @default false
   */
  required?: boolean;
  /**
   * Currently selected value. Pass `null` to render the group with no
   * item checked.
   */
  value: string | null;
  /** Fires when the user activates a different item. */
  onValueChange: (value: string) => void;
}

/** Group container. Owns the shared name, value, and visual config. */
export const RadioGroupRoot: ParentComponent<RadioGroupRootProps> = (
  rawProps,
) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      color: 'accent' as const,
      orientation: 'vertical' as const,
      disabled: false,
      required: false,
    },
    rawProps,
  );
  // Margin props, skeleton, testId, class, and the rest of the
  // standard HTML attributes pass through to `<Flex>` directly — Flex
  // already owns box props, skeleton plumbing, and class composition.
  // The keys we extract are the radiogroup's own knobs plus children.
  const [local, rest] = splitProps(props, [
    'size',
    'variant',
    'color',
    'orientation',
    'name',
    'disabled',
    'required',
    'value',
    'onValueChange',
    'children',
  ]);

  const fallbackName = createUniqueId();
  let rootRef: HTMLDivElement | undefined;

  const ctx: RadioGroupContextValue = {
    get name() {
      return local.name ?? fallbackName;
    },
    size: () => local.size,
    variant: () => local.variant,
    color: () => local.color,
    value: () => local.value,
    disabled: () => local.disabled,
    required: () => local.required,
    onValueChange: (next) => local.onValueChange(next),
    rootElement: () => rootRef,
  };

  return (
    <RadioGroupContext.Provider value={ctx}>
      <Flex
        {...rest}
        as="div"
        ref={(el) => {
          rootRef = el;
        }}
        direction={local.orientation === 'horizontal' ? 'row' : 'column'}
        wrap={local.orientation === 'horizontal' ? 'wrap' : 'nowrap'}
        gap={local.orientation === 'horizontal' ? 3 : 1}
        role="radiogroup"
        aria-orientation={local.orientation}
        aria-required={local.required ? true : undefined}
        // `data-disabled` (matches the upstream Radix primitive)
        // rather than `aria-disabled`, which isn't part of the
        // WAI-ARIA radio group pattern and may double-announce when
        // every item is already `disabled` natively. Consumers can
        // style the disabled root via the `:where([data-disabled])`
        // attribute selector.
        data-disabled={local.disabled ? '' : undefined}
      >
        {local.children}
      </Flex>
    </RadioGroupContext.Provider>
  );
};

/**
 * `RadioGroupItem` props. Identifies the item by `value` and renders
 * either a bare `<input>` or a `<label>` wrapping the input and the
 * inline children when a label is supplied.
 */
export interface RadioGroupItemProps
  extends
    RequiredTestIdProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      | 'type'
      | 'size'
      | 'color'
      | 'name'
      | 'value'
      | 'checked'
      | 'defaultChecked'
      | 'required'
    > {
  /** Value submitted when this item is checked, and matched against the group's `value`. */
  value: string;
  /** Disable just this item. Combines with the group's `disabled`. */
  disabled?: boolean;
  /** Inline label rendered to the right of the radio. */
  children?: JSX.Element;
}

/** Single radio inside a `RadioGroupRoot`. */
export const RadioGroupItem: ParentComponent<RadioGroupItemProps> = (
  rawProps,
) => {
  const ctx = useRadioGroupContext();
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'value',
    'disabled',
    'class',
    'children',
    'onChange',
    'onKeyDown',
    'style',
  ]);

  const isChecked = () => ctx.value() === local.value;
  const isDisabled = () => ctx.disabled() || local.disabled === true;

  const onChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = (event) => {
    // The change event on `<input>` is not cancelable, so a consumer
    // calling `preventDefault()` is a no-op — the controlled `value`
    // on the group is the only way to suppress the visual update.
    callConsumerHandler(local.onChange, event);
    ctx.onValueChange(local.value);

    // Reconcile every input in this group against the (possibly
    // updated) controlled value. Native radio behavior already toggled
    // the clicked input on and the previously-checked sibling off,
    // bypassing Solid's reactive bindings. If `value` didn't change
    // (parent ignored the callback), this restores the previous
    // selection; if it did change, this is a no-op since the bindings
    // would have re-applied the same checked state.
    //
    // Scoped to the radiogroup root rather than `getElementsByName` so
    // an unrelated group in a sibling form that happens to share the
    // same `name` is not clobbered. Native radios are scoped per
    // form-owner; mirroring that here keeps independent groups
    // independent. Falls back to the clicked input alone if the ref
    // has not yet been wired (e.g. inside a Suspense boundary
    // mid-mount).
    const root = ctx.rootElement();
    if (root) {
      const inputs = root.querySelectorAll<HTMLInputElement>(
        'input[type="radio"]',
      );
      const next = ctx.value();
      inputs.forEach((input) => {
        if (input.name !== ctx.name) return;
        input.checked = input.value === next;
      });
    } else {
      event.currentTarget.checked = isChecked();
    }
  };

  const onKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (
    event,
  ) => {
    callConsumerHandler(local.onKeyDown, event);
    if (event.defaultPrevented) return;
    // WAI-ARIA radio group spec: Enter does not activate radios — only
    // Space does. Native `<input type="radio">` agrees on activation,
    // but inside a `<form>` Enter still bubbles up and submits. Suppress
    // it on group items so a focused radio doesn't accidentally submit
    // a form mid-selection. The standalone `Radio` keeps native Enter
    // behavior (a single radio outside a group has no roving focus to
    // protect, and Enter-to-submit is the conventional form behavior).
    if (event.key === 'Enter') event.preventDefault();
  };

  const inputClassName = () =>
    [
      resolveRadioClasses({
        size: ctx.size(),
        variant: ctx.variant(),
        color: ctx.color(),
      }),
      // When no children are present, the consumer's `class` lands on
      // the input itself; otherwise it lands on the wrapping label
      // (set in the JSX below).
      local.children === undefined && local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const renderInput = () => (
    <input
      {...rest}
      type="radio"
      name={ctx.name}
      value={local.value}
      checked={isChecked()}
      disabled={isDisabled()}
      required={ctx.required()}
      class={inputClassName()}
      data-testid={tid.testId}
      onChange={onChange}
      onKeyDown={onKeyDown}
      // The wrapping label takes its own `style`, so only forward to
      // the input when there's no label.
      style={local.children === undefined ? local.style : undefined}
    />
  );

  return (
    <Show when={local.children !== undefined} fallback={renderInput()}>
      <Text
        as="label"
        size={ctx.size()}
        // Labels are clickable proxies for the radio — selecting their
        // text would defeat the affordance, so disable user-select on
        // the wrapping label. Consumer-supplied content inside the
        // inner span sets its own selection behavior.
        selectable={false}
        class={[css.item, local.class].filter(Boolean).join(' ')}
        style={local.style}
      >
        {renderInput()}
        <span class={css.itemInner}>{local.children}</span>
      </Text>
    </Show>
  );
};
