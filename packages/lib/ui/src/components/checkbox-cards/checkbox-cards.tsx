/**
 * CheckboxCards component.
 *
 * Ported from Radix UI Themes CheckboxCards. Exported as two flat
 * components — `CheckboxCardsRoot` and `CheckboxCardsItem` — composed
 * by the consumer. Each item is a `<label>` styled as a card surface
 * that wraps a visible `<Checkbox>` plus the consumer's content;
 * clicks anywhere on the card toggle that option in the group's
 * value array.
 *
 * Deviations from Radix:
 * - Implemented over native `<input type="checkbox">` (via the
 *   library's `Checkbox` component) rather than the primitives'
 *   `<button role="checkbox">`. The browser handles form submission
 *   and label association natively.
 * - Fully controlled — `value` (a `string[]`) and `onValueChange` are
 *   required. No `defaultValue`, no internal signal.
 * - Drops `asChild`. The root is locked to a `<div>`; each item is
 *   locked to `<label>` so the wrapping element can proxy clicks to
 *   its inner checkbox without an extra interaction layer.
 * - `color` accepts every semantic palette token. Drops
 *   `highContrast` (deferred deviation).
 * - Replaces upstream's responsive size/columns/gap object props with
 *   plain enum values (Vanilla Extract pre-compiles each variant; the
 *   responsive object form would defeat that and bloat the bundle).
 * - No `dir` / RTL or roving-focus group. Native `<input>` focus
 *   navigation in DOM order is sufficient — checkbox groups never
 *   needed a roving tabindex (Tab moves through every input).
 * - No grouping `aria-orientation`. WAI-ARIA's `group` role doesn't
 *   define orientation; consumers expressing layout intent can wrap
 *   the group in a labelled landmark themselves.
 *
 * @see https://www.radix-ui.com/themes/docs/components/checkbox-cards
 * @see https://www.radix-ui.com/primitives/docs/components/checkbox
 */

import { mergeProps, splitProps } from 'solid-js';
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
import Checkbox from '../checkbox/checkbox';
import {
  CheckboxCardsContext,
  useCheckboxCardsContext,
  type CheckboxCardsContextValue,
} from './context';
import * as css from './checkbox-cards.css';

/** Visual size on a 1–3 scale. */
export type CheckboxCardsSize = 1 | 2 | 3;
/** Visual treatment. */
export type CheckboxCardsVariant = 'surface' | 'classic';
/** Semantic color palette for the card focus outline and checkbox indicator. */
export type CheckboxCardsColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

/** Fixed column count — overrides the auto-fit default. */
export type CheckboxCardsColumns = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * `CheckboxCardsRoot` props. Renders a `<div role="group">` styled as
 * a CSS Grid and propagates shared configuration to every
 * `CheckboxCardsItem` inside.
 */
export interface CheckboxCardsRootProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'role'> {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: CheckboxCardsSize;
  /** Visual treatment. @default 'surface' */
  variant?: CheckboxCardsVariant;
  /**
   * Semantic palette for the card focus outline and the inner
   * checkbox indicator. @default 'accent'
   */
  color?: CheckboxCardsColor;
  /**
   * Fixed column count. When omitted, the grid auto-fits items into
   * `minmax(160px, 1fr)` tracks for a responsive default.
   */
  columns?: CheckboxCardsColumns;
  /** Spacing between cards. @default 4 */
  gap?: SpaceScale;
  /**
   * Form-submit name applied to every item. The browser submits one
   * entry per checked item under this name, retrievable as
   * `FormData.getAll(name)`.
   */
  name: string;
  /** Disable every item in the group. @default false */
  disabled?: boolean;
  /**
   * Mark every item as required for HTML5 form validation. Native
   * checkbox `required` validation expects that specific input to be
   * checked, so this is most useful on single-item groups (e.g. a
   * standalone "I agree" card).
   * @default false
   */
  required?: boolean;
  /** Currently checked values. Pass `[]` for an empty selection. */
  value: readonly string[];
  /** Fires when the user toggles any card. */
  onValueChange: (value: string[]) => void;
}

/** Group container. Owns the shared name, value, and visual config. */
export const CheckboxCardsRoot: ParentComponent<CheckboxCardsRootProps> = (
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
  // is on. `inert` propagates through the subtree, so the inner
  // checkbox inputs stop participating in form submission and
  // validation while the placeholder is rendered.
  const [skeletonClass, skeletonProps] = useSkeleton(skeleton, rest);

  const ctx: CheckboxCardsContextValue = {
    get name() {
      return local.name;
    },
    size: () => local.size,
    variant: () => local.variant,
    color: () => local.color,
    value: () => local.value,
    disabled: () => local.disabled,
    required: () => local.required,
    onValueChange: (next) => local.onValueChange(next),
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
    <CheckboxCardsContext.Provider value={ctx}>
      <div
        {...skeletonProps}
        // WAI-ARIA `group` is the right role for an unrelated set of
        // checkboxes (no orientation or single-selection semantics).
        // `radiogroup` would be wrong — that role implies single-select.
        role="group"
        // `data-disabled` (matches `RadioCards`) rather than
        // `aria-disabled`, which isn't part of the WAI-ARIA group
        // pattern and may double-announce when every item is already
        // `disabled` natively. Consumers can style the disabled root
        // via `:where([data-disabled])`.
        data-disabled={local.disabled ? '' : undefined}
        data-testid={tid.testId}
        class={className()}
      >
        {local.children}
      </div>
    </CheckboxCardsContext.Provider>
  );
};

/**
 * `CheckboxCardsItem` props. Identifies the card by `value` and
 * renders a `<label>` wrapping the consumer's content plus a visible
 * `<Checkbox>` pinned to the right.
 */
export interface CheckboxCardsItemProps extends RequiredTestIdProps {
  /** Value added to the group's `value` array when the card is checked. */
  value: string;
  /** Disable just this card. Combines with the group's `disabled`. */
  disabled?: boolean;
  /**
   * Override the group's `required` for this card. When omitted, the
   * card inherits the group's value. Pass `false` to opt this card
   * out of HTML5 form validation while leaving the rest required.
   */
  required?: boolean;
  /**
   * `class` lands on the wrapping `<label>` (the visible card), not
   * the inner checkbox.
   */
  class?: string;
  /** Inline style applied to the wrapping `<label>` (the visible card). */
  style?: JSX.CSSProperties | string;
  /** Card content. Rendered to the left of the inner checkbox. */
  children?: JSX.Element;
}

/** A single card inside a `CheckboxCardsRoot`. */
export const CheckboxCardsItem: ParentComponent<CheckboxCardsItemProps> = (
  rawProps,
) => {
  const ctx = useCheckboxCardsContext();
  const [tid, local] = splitProps(rawProps, [...testIdPropKeys]);

  const isChecked = () => ctx.value().includes(local.value);
  const isDisabled = () => ctx.disabled() || local.disabled === true;
  const isRequired = () => local.required ?? ctx.required();

  const onCheckedChange = (next: boolean) => {
    if (next) {
      ctx.onValueChange([...ctx.value(), local.value]);
    } else {
      ctx.onValueChange(
        ctx.value().filter((existing) => existing !== local.value),
      );
    }
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
      {local.children}
      <Checkbox
        testId={tid.testId}
        // The inner checkbox always renders in the surface variant —
        // matches upstream. The card already provides the surface, so
        // a soft fill on the indicator would clash; classic on the
        // indicator would double up the borders.
        variant="surface"
        size={ctx.size()}
        color={ctx.color()}
        checked={isChecked()}
        onCheckedChange={onCheckedChange}
        name={ctx.name}
        value={local.value}
        disabled={isDisabled()}
        required={isRequired()}
        class={css.checkbox}
      />
    </label>
  );
};
