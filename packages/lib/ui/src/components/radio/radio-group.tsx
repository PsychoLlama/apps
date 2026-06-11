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
 * - Items render either a bare `<input>` or a `<Text as="label">`
 *   wrapping the input plus its inline children — the same fork Radix
 *   exposes, but tag-locked (no `as` / `asChild`).
 * - `color` accepts every semantic palette token. Drops `highContrast`
 *   (recorded as a deferred deviation) and the `responsive` size object.
 *
 * @see https://www.radix-ui.com/themes/docs/components/radio-group
 * @see https://www.radix-ui.com/primitives/docs/components/radio-group
 */

import {
  createEffect,
  createSignal,
  mergeProps,
  Show,
  splitProps,
} from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import { type MarginProps } from '../../props/margin';
import {
  type SelectableProps,
  selectablePropKeys,
} from '../../props/selectable';
import { type SkeletonProps } from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import Flex from '../flex/flex';
import Text from '../text/text';
import {
  RadioGroupContext,
  useRadioGroupContext,
  type RadioGroupContextValue,
} from './context';
import * as css from './radio-group.css';

/** Visual size on a 1–3 scale. */
export type RadioSize = 1 | 2 | 3;
/** Visual treatment. */
export type RadioVariant = 'classic' | 'surface' | 'soft';
/** Semantic color palette for the checked indicator. */
export type RadioColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

const resolveRadioClasses = (
  size: RadioSize,
  variant: RadioVariant,
  color: RadioColor,
): string => {
  return [css.root, css.size[size], css.color[color], css.variant[variant]]
    .filter(Boolean)
    .join(' ');
};

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
   * Form-submit name applied to every item. Also groups the inputs for
   * native arrow-key navigation in the browser.
   */
  name: string;
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

  const [reconcileTick, setReconcileTick] = createSignal(0);

  const ctx: RadioGroupContextValue = {
    get name() {
      return local.name;
    },
    size: () => local.size,
    variant: () => local.variant,
    color: () => local.color,
    value: () => local.value,
    disabled: () => local.disabled,
    required: () => local.required,
    reconcileTick,
    notifyChange: (next) => {
      local.onValueChange(next);
      setReconcileTick((tick) => tick + 1);
    },
  };

  return (
    <RadioGroupContext.Provider value={ctx}>
      <Flex
        {...rest}
        as="div"
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
    SelectableProps,
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
  /**
   * Allow the reader to select the label text. The indicator never
   * participates in selection. @default false
   */
  selectable?: boolean;
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
    ...selectablePropKeys,
  ]);

  const isChecked = () => ctx.value() === local.value;
  const isDisabled = () => ctx.disabled() || local.disabled === true;

  // Reconcile the input's `.checked` property after every change event.
  // The JSX `checked={isChecked()}` binding is routed through Solid's
  // `spread()` (because the `<input>` also has `{...rest}`), which
  // early-bails in `assignProp` when the new value equals the previously
  // applied value. After a native click the browser flips `.checked` on
  // both the clicked input and the previously-checked sibling, but
  // Solid's last-applied tracking doesn't see those mutations — so when
  // the parent ignores `onValueChange` and `ctx.value()` stays the same,
  // the binding skips the re-apply and the DOM stays diverged. A manual
  // effect keyed on `reconcileTick` (bumped by `ctx.notifyChange` on
  // every change) sidesteps the spread path and imperatively writes
  // `.checked` to match the controlled prop.
  let inputRef: HTMLInputElement | undefined;
  createEffect(() => {
    ctx.reconcileTick();
    if (inputRef) inputRef.checked = isChecked();
  });

  const onChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = (event) => {
    // The change event on `<input>` is not cancelable, so a consumer
    // calling `preventDefault()` is a no-op — the controlled `value`
    // on the group is the only way to suppress the visual update.
    if (typeof local.onChange === 'function') local.onChange(event);
    ctx.notifyChange(local.value);
  };

  const onKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (
    event,
  ) => {
    if (typeof local.onKeyDown === 'function') local.onKeyDown(event);
    if (event.defaultPrevented) return;
    // WAI-ARIA radio group spec: Enter does not activate radios — only
    // Space does. Native `<input type="radio">` agrees on activation,
    // but inside a `<form>` Enter still bubbles up and submits. Suppress
    // it so a focused radio doesn't accidentally submit a form
    // mid-selection.
    if (event.key === 'Enter') event.preventDefault();
  };

  const inputClassName = () =>
    [
      resolveRadioClasses(ctx.size(), ctx.variant(), ctx.color()),
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
      ref={(el) => {
        inputRef = el;
      }}
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
        // Label selection is opt-in (`selectable`, default false). The
        // indicator stays out of any selection regardless via
        // `user-select: none` on the input itself (see `radio-group.css`),
        // so dragging across the disc never starts a selection — only the
        // label text does, and only when `selectable` is set.
        selectable={local.selectable ?? false}
        class={[css.item, local.class].filter(Boolean).join(' ')}
        style={local.style}
      >
        {renderInput()}
        <span class={css.itemInner}>{local.children}</span>
      </Text>
    </Show>
  );
};
