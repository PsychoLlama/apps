/**
 * RadioCards component.
 *
 * Ported from Radix UI Themes RadioCards. Exported as two flat
 * components — `RadioCardsRoot` and `RadioCardsItem` — composed by the
 * consumer. Each item is a `<label>` styled as a card surface that
 * wraps a visually-hidden `<input type="radio">` plus visible content;
 * clicks anywhere on the card select the option.
 *
 * Deviations from Radix:
 * - Implemented over native `<input type="radio">` rather than the
 *   primitives' `<button role="radio">`, matching `RadioGroup`. The
 *   browser handles arrow-key navigation and form submission natively
 *   when items share a `name`.
 * - Fully controlled — `value` and `onValueChange` are required. No
 *   `defaultValue`, no internal signal.
 * - Drops `asChild`. The root is locked to `<div role="radiogroup">`;
 *   each item is locked to `<label>` so the wrapping element can proxy
 *   clicks to its hidden input without an extra interaction layer.
 * - `color` accepts every semantic palette token. Drops
 *   `highContrast` (deferred deviation).
 * - Replaces upstream's responsive size/columns/gap object props with
 *   plain enum values (Vanilla Extract pre-compiles each variant; the
 *   responsive object form would defeat that and bloat the bundle).
 *
 * @see https://www.radix-ui.com/themes/docs/components/radio-cards
 */

import { createEffect, createSignal, mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import type { SpaceScale } from '@lib/design';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  skeletonPropKeys,
  useSkeleton,
  type SkeletonProps,
} from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import {
  RadioCardsContext,
  useRadioCardsContext,
  type RadioCardsContextValue,
} from './context';
import * as css from './radio-cards.css';

/** Visual size on a 1–3 scale. */
export type RadioCardsSize = 1 | 2 | 3;
/** Visual treatment. */
export type RadioCardsVariant = 'surface' | 'classic';
/** Semantic color palette for the checked outline. */
export type RadioCardsColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

/** Fixed column count — overrides the auto-fit default. */
export type RadioCardsColumns = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * `RadioCardsRoot` props. Renders a `<div role="radiogroup">` styled as
 * a CSS Grid and propagates shared configuration to every
 * `RadioCardsItem` inside.
 */
export interface RadioCardsRootProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'role'> {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: RadioCardsSize;
  /** Visual treatment. @default 'surface' */
  variant?: RadioCardsVariant;
  /**
   * Semantic palette for the checked outline and focus ring.
   * @default 'accent'
   */
  color?: RadioCardsColor;
  /**
   * Fixed column count. When omitted, the grid auto-fits items into
   * `minmax(160px, 1fr)` tracks for a responsive default.
   */
  columns?: RadioCardsColumns;
  /** Spacing between cards. @default 4 */
  gap?: SpaceScale;
  /**
   * Form-submit name applied to every item. Also groups the inputs
   * for native arrow-key navigation in the browser.
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
   * card selected.
   */
  value: string | null;
  /** Fires when the user selects a different card. */
  onValueChange: (value: string) => void;
}

/** Group container. Owns the shared name, value, and visual config. */
export const RadioCardsRoot: ParentComponent<RadioCardsRootProps> = (
  rawProps,
) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      color: 'accent' as const,
      gap: 4 as const,
      disabled: false,
      required: false,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [skeleton, withoutSkeleton] = splitProps(withoutMargin, [
    ...skeletonPropKeys,
  ]);
  const [tid, withoutTid] = splitProps(withoutSkeleton, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'color',
    'columns',
    'gap',
    'name',
    'disabled',
    'required',
    'value',
    'onValueChange',
    'class',
    'children',
  ]);
  // `useSkeleton` returns the visual class plus a `mergeProps` proxy
  // that adds `inert` / `aria-hidden` / `tabindex={-1}` while skeleton
  // is on. `inert` propagates through the subtree, so the hidden radio
  // inputs stop participating in form submission and validation while
  // the placeholder is rendered.
  const [skeletonClass, skeletonProps] = useSkeleton(skeleton, rest);

  const [reconcileTick, setReconcileTick] = createSignal(0);

  const ctx: RadioCardsContextValue = {
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

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      local.columns && css.columns[local.columns],
      css.gap[local.gap],
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <RadioCardsContext.Provider value={ctx}>
      <div
        {...skeletonProps}
        role="radiogroup"
        aria-required={local.required ? true : undefined}
        // `data-disabled` (matches `RadioGroup`) rather than
        // `aria-disabled`, which isn't part of the WAI-ARIA radiogroup
        // pattern and may double-announce when every item is already
        // `disabled` natively. Consumers can style the disabled root
        // via `:where([data-disabled])`.
        data-disabled={local.disabled ? '' : undefined}
        data-testid={tid.testId}
        class={className()}
      >
        {local.children}
      </div>
    </RadioCardsContext.Provider>
  );
};

/**
 * `RadioCardsItem` props. Identifies the card by `value` and renders a
 * `<label>` wrapping a hidden `<input type="radio">` plus the children
 * as visible content.
 */
export interface RadioCardsItemProps
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
      | 'class'
      | 'style'
      | 'children'
    > {
  /** Value submitted when this card is selected, and matched against the group's `value`. */
  value: string;
  /** Disable just this card. Combines with the group's `disabled`. */
  disabled?: boolean;
  /**
   * `class` lands on the wrapping `<label>` (the visible card), not
   * the hidden input.
   */
  class?: string;
  /**
   * Inline style applied to the wrapping `<label>` (the visible card).
   */
  style?: JSX.CSSProperties | string;
  /** Card content. Rendered inside the wrapping `<label>`. */
  children?: JSX.Element;
}

/** A single card inside a `RadioCardsRoot`. */
export const RadioCardsItem: ParentComponent<RadioCardsItemProps> = (
  rawProps,
) => {
  const ctx = useRadioCardsContext();
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'value',
    'disabled',
    'class',
    'style',
    'children',
    'onChange',
    'onKeyDown',
  ]);

  const isChecked = () => ctx.value() === local.value;
  const isDisabled = () => ctx.disabled() || local.disabled === true;

  // Same reconcile pattern as RadioGroup — see context.ts. Native radio
  // semantics flip `.checked` on two inputs (clicked + previously
  // checked) but only fire `change` on one, and Solid's spread can
  // skip re-applying when the controlled value didn't move. A keyed
  // effect bypasses spread and writes `.checked` directly.
  let inputRef: HTMLInputElement | undefined;
  createEffect(() => {
    ctx.reconcileTick();
    if (inputRef) inputRef.checked = isChecked();
  });

  const onChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = (event) => {
    if (typeof local.onChange === 'function') local.onChange(event);
    ctx.notifyChange(local.value);
  };

  const onKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (
    event,
  ) => {
    if (typeof local.onKeyDown === 'function') local.onKeyDown(event);
    if (event.defaultPrevented) return;
    // Match RadioGroup: WAI-ARIA radio activation uses Space, not
    // Enter. Suppress Enter so a focused card doesn't accidentally
    // submit a wrapping form mid-selection.
    if (event.key === 'Enter') event.preventDefault();
  };

  const labelClassName = () =>
    [
      css.item,
      css.size[ctx.size()],
      css.variant[ctx.variant()],
      css.color[ctx.color()],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <label class={labelClassName()} style={local.style}>
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
        class={css.input}
        data-testid={tid.testId}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      {local.children}
    </label>
  );
};
