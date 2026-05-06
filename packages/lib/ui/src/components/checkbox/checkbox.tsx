/**
 * Checkbox component.
 *
 * Ported from Radix UI Themes Checkbox (which wraps the Checkbox
 * primitive).
 *
 * Deviations from Radix:
 * - Implemented over native `<input type="checkbox">` rather than the
 *   primitive's `<button role="checkbox">`. The browser handles form
 *   submission, label association, and keyboard activation natively;
 *   the bubble-input shim Radix renders to thread checked state into
 *   `FormData` becomes unnecessary.
 * - Fully controlled — `checked` and `onCheckedChange` are required.
 *   No `defaultChecked`, no internal signal. The consumer owns the
 *   source of truth, including the `'indeterminate'` tri-state.
 * - Renders either a bare `<input>` or a `<Text as="label">` wrapping
 *   the input plus its inline children — the same fork Radix exposes
 *   on the radio side, but tag-locked (no `as` / `asChild`).
 * - `color` accepts every semantic palette token. Drops `highContrast`
 *   (recorded as a deferred deviation).
 *
 * @see https://www.radix-ui.com/themes/docs/components/checkbox
 * @see https://www.radix-ui.com/primitives/docs/components/checkbox
 */

import { createEffect, mergeProps, Show, splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
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
import Text from '../text/text';
import * as css from './checkbox.css';

/** Visual size on a 1–3 scale. */
export type CheckboxSize = 1 | 2 | 3;
/** Visual treatment. */
export type CheckboxVariant = 'classic' | 'surface' | 'soft';
/** Semantic color palette for the checked indicator. */
export type CheckboxColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

/**
 * Tri-state value. `true` and `false` cover the binary cases;
 * `'indeterminate'` paints the divider glyph and surfaces as the native
 * `:indeterminate` pseudo-class on the input.
 */
export type CheckboxChecked = boolean | 'indeterminate';

/**
 * `Checkbox` props. Surfaces native `<input>` attributes apart from the
 * fields the component owns (`type`, `checked`, `defaultChecked`,
 * `value`, `name`, `size`, `color`, `required`) and the visual props
 * that collide with our prop scheme. `children` becomes the inline
 * label and is opt-in.
 */
export interface CheckboxProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      | 'type'
      | 'size'
      | 'color'
      | 'checked'
      | 'defaultChecked'
      | 'value'
      | 'children'
      | 'onChange'
    > {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: CheckboxSize;
  /** Visual treatment. @default 'surface' */
  variant?: CheckboxVariant;
  /** Semantic color palette for the checked indicator. @default 'accent' */
  color?: CheckboxColor;
  /**
   * Controlled checked state. `'indeterminate'` paints the divider
   * glyph; clicking from indeterminate moves to `true` (matching
   * Radix and native browser behavior).
   */
  checked: CheckboxChecked;
  /**
   * Fires after the user toggles the checkbox with the next state.
   * `'indeterminate'` is never emitted — it can only be entered by
   * the consumer setting `checked` directly.
   */
  onCheckedChange: (checked: boolean) => void;
  /**
   * Form-submit name. When checked, the browser includes the field
   * in `FormData`; when unchecked or indeterminate, it's omitted —
   * matches native `<input type="checkbox">` semantics.
   */
  name?: string;
  /**
   * Form-submit value when checked. Mirrors the native `value`
   * attribute on `<input type="checkbox">`.
   * @default 'on'
   */
  value?: string;
  /**
   * Mark the checkbox as required for assistive technology. Surfaces
   * as the native `required` attribute on the input.
   * @default false
   */
  required?: boolean;
  /** Inline label rendered to the right of the checkbox. */
  children?: JSX.Element;
}

/**
 * Tri-state checkbox. Renders a styled native
 * `<input type="checkbox">`, optionally wrapped in a `<label>` when
 * inline children are supplied.
 */
const Checkbox: Component<CheckboxProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      color: 'accent' as const,
      value: 'on',
      required: false,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'color',
    'checked',
    'onCheckedChange',
    'children',
    'class',
    'style',
    'onClick',
    'onKeyDown',
    'disabled',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  // Native `indeterminate` is a property only — there is no matching
  // attribute, so JSX bindings can't surface it. An effect mirrors the
  // controlled `checked` value into `input.indeterminate` after every
  // render, which is also what activates the `:indeterminate` selector
  // the stylesheet uses to swap the indicator mask.
  let inputRef: HTMLInputElement | undefined;
  createEffect(() => {
    if (inputRef) inputRef.indeterminate = local.checked === 'indeterminate';
  });

  const onChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = (event) => {
    // Indeterminate → true mirrors Radix's CheckboxTrigger semantics
    // and the browser's own indeterminate behavior on click. Once a
    // user interacts with the checkbox, the tri-state collapses to
    // a binary toggle.
    const next = local.checked === 'indeterminate' ? true : !local.checked;
    local.onCheckedChange(next);
    // The change event is not cancelable, so a consumer ignoring
    // `onCheckedChange` is the only mechanism for suppressing the
    // visual update. After a no-op consumer, reconcile the DOM back
    // to the controlled value — Solid's binding tracker doesn't see
    // the native mutation and would otherwise leave the checkbox
    // diverged from the prop.
    if (event.currentTarget) {
      event.currentTarget.checked = local.checked === true;
      event.currentTarget.indeterminate = local.checked === 'indeterminate';
    }
  };

  const onKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (
    event,
  ) => {
    if (typeof local.onKeyDown === 'function') local.onKeyDown(event);
    if (event.defaultPrevented) return;
    // WAI-ARIA: Enter does not activate checkboxes — only Space does.
    // Native checkboxes already ignore Enter for activation, but inside
    // a `<form>` Enter still bubbles up and submits. Suppress it so a
    // focused checkbox doesn't accidentally submit a form mid-toggle.
    if (event.key === 'Enter') event.preventDefault();
  };

  const inputClassName = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.color[local.color],
      css.variant[local.variant],
      skeletonClass(),
      // When no children are present, the consumer's `class` lands on
      // the input itself; otherwise it lands on the wrapping label
      // (set in the JSX below).
      local.children === undefined && local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const renderInput = () => (
    <input
      {...skeletonProps}
      ref={(el) => {
        inputRef = el;
      }}
      type="checkbox"
      checked={local.checked === true}
      disabled={local.disabled}
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
        size={local.size}
        // Labels are clickable proxies for the checkbox — selecting
        // their text would defeat the affordance, so disable user-
        // select on the wrapping label. Consumer-supplied content
        // inside the inner span sets its own selection behavior.
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

export default Checkbox;
