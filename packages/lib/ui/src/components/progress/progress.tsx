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
 *   indeterminate state.
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
   * omit) for an indeterminate, animated bar. @default null
   */
  value?: number | null;
  /** Maximum value. @default 100 */
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

const defaultGetValueLabel = (value: number, max: number) =>
  `${Math.round((value / max) * 100)}%`;

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

  const isDeterminate = () => typeof local.value === 'number';
  const ariaValueNow = () =>
    isDeterminate() ? (local.value as number) : undefined;
  const ariaValueText = () =>
    isDeterminate()
      ? local.getValueLabel(local.value as number, local.max)
      : undefined;

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.color[local.color],
      css.variant[local.variant],
      css.radiusVariant[local.radius],
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
  // `--progress-duration` to the keyframe schedule and let the
  // animation own the transform.
  const indicatorStyle = (): JSX.CSSProperties =>
    isDeterminate()
      ? { transform: `scaleX(${(local.value as number) / local.max})` }
      : { '--progress-duration': local.duration };

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={local.max}
      aria-valuenow={ariaValueNow()}
      aria-valuetext={ariaValueText()}
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
