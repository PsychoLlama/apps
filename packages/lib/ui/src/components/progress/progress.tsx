/**
 * Progress component.
 *
 * Ported from Radix UI Themes Progress and Radix UI Primitives Progress.
 * Deviations:
 * - No `asChild` polymorphism — locks to `<div role="progressbar">`.
 * - Compound Root/Indicator API collapses into one component. The
 *   indicator never accepts children upstream, so a single component
 *   covers the contract — no exported `ProgressIndicator`.
 * - Drops Radix's invalid-prop console warnings; TypeScript catches
 *   bad call sites at build time. `null` is the sentinel for the
 *   indeterminate state. Out-of-range or non-finite `value` and
 *   non-positive / non-finite `max` are coerced (silently) to keep
 *   the ARIA contract and transform math sane — same fallback shape
 *   as Radix, minus the warnings.
 * - No `data-state`. Determinate vs. indeterminate is a class variant
 *   on the indicator, and `aria-valuenow` carries the assistive-tech
 *   contract.
 * - Drops the high-contrast variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/progress
 * @see https://www.radix-ui.com/primitives/docs/components/progress
 */

import { mergeProps, splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
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
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './progress.css';

/** Visual size on a 1–3 scale. */
export type ProgressSize = 1 | 2 | 3;
/** Visual treatment. */
export type ProgressVariant = 'classic' | 'surface' | 'soft';
/** Corner rounding. */
export type ProgressRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
/** Semantic color palette for the indicator. */
export type ProgressColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

/**
 * `Progress` props. Surfaces native `<div>` attributes apart from the
 * ARIA progressbar contract (`role`, `aria-valuemin`/`max`/`now`/`text`)
 * and `children` — the indicator is rendered internally.
 */
export interface ProgressProps
  extends
    MarginProps,
    SkeletonProps,
    TestIdProps,
    Omit<
      JSX.HTMLAttributes<HTMLDivElement>,
      | 'role'
      | 'aria-valuemin'
      | 'aria-valuemax'
      | 'aria-valuenow'
      | 'aria-valuetext'
      | 'children'
    > {
  /**
   * Current progress value between `0` and `max`. Pass `null` (or
   * omit) for an indeterminate, animated bar. Values outside
   * `[0, max]` (or non-finite) collapse to indeterminate. @default null
   */
  value?: number | null;
  /**
   * Maximum value. Non-positive or non-finite inputs fall back to
   * `100`. @default 100
   */
  max?: number;
  /**
   * Format the `aria-valuetext` announcement. Receives the current
   * value and max. @default `${Math.round(value / max * 100)}%`
   */
  getValueLabel?: (value: number, max: number) => string;
  /** Visual size on a 1–3 scale. @default 2 */
  size?: ProgressSize;
  /** Visual treatment. @default 'surface' */
  variant?: ProgressVariant;
  /** Corner rounding. @default 'full' */
  radius?: ProgressRadius;
  /** Semantic color palette for the indicator. @default 'accent' */
  color?: ProgressColor;
  /**
   * Length of the indeterminate "grow" phase before the bar settles
   * into a pulse. Ignored when `value` is a number. @default '5s'
   */
  duration?: `${number}s` | `${number}ms`;
}

const DEFAULT_MAX = 100;

const defaultGetValueLabel = (value: number, max: number) =>
  `${Math.round((value / max) * 100)}%`;

// Mirrors Radix's `isValidMaxNumber`. Drops invalid inputs back to
// `DEFAULT_MAX` rather than warning — TypeScript already gates the
// happy path; the runtime guard exists so a stray runtime value
// (`0`, `NaN`, negative) doesn't poison ARIA or the transform math.
const safeMax = (max: number): number =>
  Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX;

// Mirrors Radix's `isValidValueNumber`. Anything out of `[0, max]`
// or non-finite collapses to the indeterminate sentinel — Radix does
// the same. Keeps `aria-valuenow ≤ aria-valuemax` an enforceable
// invariant and guarantees the transform stays in `scaleX(0..1)`.
const safeValue = (
  value: number | null | undefined,
  max: number,
): number | null =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= max
    ? value
    : null;

/**
 * Linear progress bar. Renders a `<div role="progressbar">` with an
 * inner indicator. Pass `value` (0–`max`) for a determinate bar; omit
 * or pass `null` for an indeterminate animation.
 */
const Progress: Component<ProgressProps> = (rawProps) => {
  const props = mergeProps(
    {
      value: null,
      max: 100,
      size: 2 as const,
      variant: 'surface' as const,
      radius: 'full' as const,
      color: 'accent' as const,
      duration: '5s' as const,
      getValueLabel: defaultGetValueLabel,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'value',
    'max',
    'getValueLabel',
    'size',
    'variant',
    'radius',
    'color',
    'duration',
    'class',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const max = () => safeMax(local.max);
  const value = () => safeValue(local.value, max());
  const isDeterminate = () => value() !== null;
  const ariaValueText = () => {
    const current = value();
    return current === null ? undefined : local.getValueLabel(current, max());
  };

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.color[local.color],
      css.variant[local.variant],
      css.radius[local.radius],
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const indicatorClass = () =>
    [
      css.indicator,
      isDeterminate()
        ? css.indicatorState.determinate
        : css.indicatorState.indeterminate,
    ].join(' ');

  // Determinate: drive scaleX from value/max. Indeterminate: hand
  // `progressDuration` to the keyframe schedule and let the animation
  // own the transform.
  const indicatorStyle = (): JSX.CSSProperties => {
    const current = value();
    return current === null
      ? assignInlineVars({ [css.progressDuration]: local.duration })
      : { transform: `scaleX(${current / max()})` };
  };

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max()}
      aria-valuenow={value() ?? undefined}
      aria-valuetext={ariaValueText()}
      data-value={value() ?? undefined}
      data-max={max()}
      class={className()}
      data-testid={tid.testId}
      {...skeletonProps}
    >
      <div
        class={indicatorClass()}
        style={indicatorStyle()}
        aria-hidden="true"
      />
    </div>
  );
};

export default Progress;
