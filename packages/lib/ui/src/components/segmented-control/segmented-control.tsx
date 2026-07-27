/**
 * SegmentedControl component.
 *
 * Ported from Radix UI Themes SegmentedControl. Exported as two flat
 * components — `SegmentedControlRoot` and `SegmentedControlItem` —
 * composed by the consumer. Each item is a `<label>` wrapping a
 * visually-hidden `<input type="radio">`, and a shared indicator chip
 * slides between columns as the selection moves.
 *
 * Deviations from Radix:
 * - Implemented over native `<input type="radio">` inside a
 *   `role="radiogroup"`, rather than upstream's ToggleGroup of
 *   `role="radio"` buttons inside a `role="group"`. That pairing is
 *   invalid ARIA, and it also costs upstream selection-follows-focus:
 *   its roving-focus group moves focus with the arrow keys but leaves
 *   selection behind until Space. Native radios give the WAI-ARIA
 *   behavior, form submission, and roving `tabindex` for free —
 *   matching `RadioGroup` and `RadioCards`.
 * - Fully controlled — `value` and `onValueChange` are required. No
 *   `defaultValue`, no internal signal.
 * - Requires a `name`, which groups the inputs for native arrow-key
 *   navigation and names the field on submit.
 * - Supports per-item `disabled`. Upstream hard-codes `disabled={false}`
 *   on items and only accepts the flag on the root.
 * - Drops `asChild`. The root is locked to `<div role="radiogroup">`
 *   and each item to `<label>`, so the visible surface can proxy
 *   clicks to its input without an extra interaction layer.
 * - Replaces upstream's responsive `size` object prop with a plain
 *   enum (Vanilla Extract pre-compiles each variant; the responsive
 *   object form would defeat that and bloat the bundle).
 * - No `dir` / RTL arrow-key reversal. Native radios navigate in DOM
 *   order regardless of writing direction.
 * - Renders its children twice per item — once at checked weight, once
 *   at unchecked — to cross-fade between them without reflowing the
 *   track. Same trick upstream uses; keep item content cheap and free
 *   of side effects.
 *
 * @see https://www.radix-ui.com/themes/docs/components/segmented-control
 */

import { createEffect, createSignal, mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
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
  SegmentedControlContext,
  useSegmentedControlContext,
  type SegmentedControlContextValue,
} from './context';
import * as css from './segmented-control.css';

/** Visual size on a 1–3 scale. */
export type SegmentedControlSize = 1 | 2 | 3;

/** Visual treatment of the selected-segment indicator. */
export type SegmentedControlVariant = 'surface' | 'classic';

/** Track rounding. Overrides the rounding implied by `size`. */
export type SegmentedControlRadius =
  'none' | 'small' | 'medium' | 'large' | 'full';

/**
 * `SegmentedControlRoot` props. Renders a `<div role="radiogroup">` laid
 * out as a row of equal-width columns and propagates the group wiring to
 * every `SegmentedControlItem` inside.
 */
export interface SegmentedControlRootProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'role'> {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: SegmentedControlSize;
  /** Visual treatment of the selected-segment indicator. @default 'surface' */
  variant?: SegmentedControlVariant;
  /** Track rounding. Omit to inherit the rounding implied by `size`. */
  radius?: SegmentedControlRadius;
  /**
   * Form-submit name applied to every item. Also groups the inputs
   * for native arrow-key navigation in the browser.
   */
  name: string;
  /** Disable every segment in the group. @default false */
  disabled?: boolean;
  /**
   * Mark the group as required for assistive technology. Surfaces as
   * `aria-required="true"` on the radiogroup and as the native
   * `required` attribute on every item. @default false
   */
  required?: boolean;
  /**
   * Currently selected value. Pass `null` to render the track with no
   * segment selected and the indicator hidden.
   */
  value: string | null;
  /** Fires when the user selects a different segment. */
  onValueChange: (value: string) => void;
}

/** Group container. Owns the shared name, value, and visual config. */
export const SegmentedControlRoot: ParentComponent<
  SegmentedControlRootProps
> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
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
    'radius',
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

  const ctx: SegmentedControlContextValue = {
    get name() {
      return local.name;
    },
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
      css.size[local.size],
      css.variant[local.variant],
      local.radius && css.radiusVariant[local.radius],
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <SegmentedControlContext.Provider value={ctx}>
      <div
        {...skeletonProps}
        role="radiogroup"
        aria-orientation="horizontal"
        aria-required={local.required ? true : undefined}
        // `data-disabled` (matching `RadioGroup` / `RadioCards`) rather
        // than `aria-disabled`, which isn't part of the WAI-ARIA
        // radiogroup pattern and may double-announce when every item is
        // already `disabled` natively.
        data-disabled={local.disabled ? '' : undefined}
        data-testid={tid.testId}
        class={className()}
      >
        {/*
          The indicator leads the items so paint order keeps it beneath
          their labels — see the stylesheet's module comment. It is
          purely decorative; the checked input carries the state.
        */}
        <div class={css.indicator} aria-hidden="true" />
        {local.children}
      </div>
    </SegmentedControlContext.Provider>
  );
};

/**
 * `SegmentedControlItem` props. Identifies the segment by `value` and
 * renders a `<label>` wrapping a hidden `<input type="radio">` plus the
 * children as visible content.
 */
export interface SegmentedControlItemProps
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
  /** Value submitted when this segment is selected, and matched against the group's `value`. */
  value: string;
  /** Disable just this segment. Combines with the group's `disabled`. */
  disabled?: boolean;
  /**
   * Override the group's `required` for this segment. When omitted,
   * the segment inherits the group's value. Pass `false` to opt this
   * segment out of native HTML5 form validation while leaving the rest
   * of the group required.
   */
  required?: boolean;
  /**
   * `class` lands on the wrapping `<label>` (the visible segment), not
   * the hidden input.
   */
  class?: string;
  /** Inline style applied to the wrapping `<label>`. */
  style?: JSX.CSSProperties | string;
  /** Segment content. Rendered inside the wrapping `<label>`. */
  children?: JSX.Element;
}

/** A single segment inside a `SegmentedControlRoot`. */
export const SegmentedControlItem: ParentComponent<
  SegmentedControlItemProps
> = (rawProps) => {
  const ctx = useSegmentedControlContext();
  const [tid, withoutTid] = splitProps(rawProps, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'value',
    'disabled',
    'required',
    'class',
    'style',
    'children',
    'onChange',
    'onKeyDown',
  ]);

  const isChecked = () => ctx.value() === local.value;
  const isDisabled = () => ctx.disabled() || local.disabled === true;
  const isRequired = () => local.required ?? ctx.required();

  // Same reconcile pattern as RadioGroup / RadioCards — see context.ts.
  // Native radio semantics flip `.checked` on two inputs (clicked +
  // previously checked) but only fire `change` on one, and Solid's
  // spread can skip re-applying when the controlled value didn't move.
  // A keyed effect bypasses spread and writes `.checked` directly.
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
    // Enter. Suppress Enter so a focused segment doesn't accidentally
    // submit a wrapping form mid-selection.
    if (event.key === 'Enter') event.preventDefault();
  };

  const labelClassName = () =>
    [css.item, local.class].filter(Boolean).join(' ');

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
        required={isRequired()}
        class={css.input}
        data-testid={tid.testId}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <span class={css.separator} />
      <span class={css.content}>
        <span class={css.labelChecked}>{local.children}</span>
        {/*
          The unchecked copy duplicates the label's text, so it's hidden
          from assistive tech to keep the input's accessible name from
          doubling up.
        */}
        <span class={css.labelUnchecked} aria-hidden="true">
          {local.children}
        </span>
      </span>
    </label>
  );
};
