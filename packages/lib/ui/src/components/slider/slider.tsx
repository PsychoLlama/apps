/**
 * Slider component.
 *
 * Ported from Radix UI Themes Slider and Radix UI Primitives Slider.
 * Deviations:
 * - One semantic structure: a `<span>` root containing track, range,
 *   and one absolute-positioned thumb `<span role="slider">` per
 *   value. No compound API (`Slider.Root/Track/Range/Thumb`).
 * - Controlled-only: pair `value` with `onValueChange`. The `value`
 *   array drives the thumb count — pass `[20]` for a single thumb,
 *   `[20, 80]` for a range, `[20, 50, 80]` for three. Drops Radix's
 *   `defaultValue` opt-in to uncontrolled state.
 * - No `dir` prop / RTL handling. `inverted` covers reverse-axis
 *   layouts; full bidi support belongs in a follow-up once the rest
 *   of the system models direction.
 * - Drops Radix's high-contrast styling.
 * - Form integration via plain `<input type="hidden">` mirrors —
 *   one per thumb, suffixing the name with `[]` for multi-thumb
 *   sliders so `FormData` parses as an array. Skips Radix's
 *   bubble-input dance; consumers that need synthetic form `input`
 *   events should listen to `onValueChange` directly.
 * - No thumb in-bounds offset. At the rail's extreme ends the thumb
 *   visually centers on the percentage point and overhangs the track
 *   slightly — same affordance most modern sliders ship with. Track
 *   it as a follow-up if the overhang ever bothers a real consumer.
 * - Home/End operate on the focused thumb. Radix's primitive
 *   hardcodes index 0 / last, which contradicts the W3C multi-thumb
 *   slider pattern; we follow the spec instead so pressing End on
 *   the minimum thumb doesn't slingshot the maximum one.
 *
 * @see https://www.radix-ui.com/themes/docs/components/slider
 * @see https://www.radix-ui.com/primitives/docs/components/slider
 */

import { createEffect, Index, mergeProps, Show, splitProps } from 'solid-js';
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
import * as css from './slider.css';

/** Visual size on a 1–3 scale. */
export type SliderSize = 1 | 2 | 3;
/** Visual treatment. */
export type SliderVariant = 'classic' | 'surface' | 'soft';
/** Corner rounding. */
export type SliderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
/** Semantic palette for the filled range. */
export type SliderColor =
  'accent' | 'neutral' | 'danger' | 'warning' | 'success';
/** Layout axis. */
export type SliderOrientation = 'horizontal' | 'vertical';

const PAGE_KEYS = ['PageUp', 'PageDown'];
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

type Edge = 'top' | 'right' | 'bottom' | 'left';

/**
 * `Slider` props. Surfaces native `<span>` attributes apart from
 * `children` (the slider renders track/range/thumbs) and the visual
 * `color` prop, which collides with our scheme.
 */
export interface SliderProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'color' | 'children'> {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: SliderSize;
  /** Visual treatment. @default 'surface' */
  variant?: SliderVariant;
  /** Corner rounding. @default 'full' */
  radius?: SliderRadius;
  /** Semantic palette for the filled range. @default 'accent' */
  color?: SliderColor;
  /** Layout axis. @default 'horizontal' */
  orientation?: SliderOrientation;
  /** Reverse the slide axis. @default false */
  inverted?: boolean;
  /** Disables interaction and focus. @default false */
  disabled?: boolean;
  /** Lower bound of the slider's range. @default 0 */
  min?: number;
  /** Upper bound of the slider's range. @default 100 */
  max?: number;
  /** Smallest value increment. @default 1 */
  step?: number;
  /**
   * Minimum number of `step`s required between any two thumbs.
   * Useful for range sliders that must keep handles apart.
   * @default 0
   */
  minStepsBetweenThumbs?: number;
  /**
   * Controlled value(s). Length determines the thumb count:
   * one thumb for a single value, multiple for a range.
   */
  value: number[];
  /** Fires every time the value changes (drag, keyboard, click). */
  onValueChange: (value: number[]) => void;
  /** Fires once after a slide gesture or keystroke commits. */
  onValueCommit?: (value: number[]) => void;
  /**
   * Form field name. Renders one hidden input per thumb when set.
   * Multi-thumb sliders append `[]` so `FormData` parses as a list.
   */
  name?: string;
  /** Associates the hidden inputs with a form by id. */
  form?: string;
}

/**
 * Range input with one or more thumbs. Thumbs render at percentages
 * of `[min, max]`; the filled range visualizes the gap between them.
 * Use a single-element `value` for a regular slider, a multi-element
 * `value` for a range.
 */
const Slider: Component<SliderProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      radius: 'full' as const,
      color: 'accent' as const,
      orientation: 'horizontal' as const,
      inverted: false,
      disabled: false,
      min: 0,
      max: 100,
      step: 1,
      minStepsBetweenThumbs: 0,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'radius',
    'color',
    'orientation',
    'inverted',
    'disabled',
    'min',
    'max',
    'step',
    'minStepsBetweenThumbs',
    'value',
    'onValueChange',
    'onValueCommit',
    'name',
    'form',
    'class',
    'onPointerDown',
    'onPointerMove',
    'onPointerUp',
    'onKeyDown',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  let rootEl: HTMLSpanElement | undefined;
  const thumbRefs: HTMLElement[] = [];
  let valueIndexToChange = 0;
  let valuesBeforeSlideStart: number[] = [];
  let cachedRect: DOMRect | undefined;

  // Trim `thumbRefs` whenever the value array shrinks. Solid's `<Index>`
  // unmounts the trailing thumbs but doesn't clear the ref slots — left
  // alone, the array would retain detached DOM nodes (memory) and could
  // hand a stale element to the focus microtask below.
  createEffect(() => {
    thumbRefs.length = local.value.length;
  });

  const isHorizontal = () => local.orientation === 'horizontal';

  // `direction` is `+1` when the slide axis runs in CSS-positive
  // direction (left-to-right or top-to-bottom in absolute terms) and
  // `-1` otherwise. `startEdge` is the edge that the range fill grows
  // away from — read it for both range positioning and per-thumb
  // anchoring so the same percentage drives both layers.
  const startEdge = (): Edge => {
    if (isHorizontal()) return local.inverted ? 'right' : 'left';
    return local.inverted ? 'top' : 'bottom';
  };

  const endEdge = (): Edge => {
    if (isHorizontal()) return local.inverted ? 'left' : 'right';
    return local.inverted ? 'bottom' : 'top';
  };

  const thumbTransform = (): string => {
    // Centers the thumb on the percentage point regardless of which
    // edge it's anchored to. Matches Radix's two-axis transform pair.
    if (isHorizontal()) {
      return local.inverted ? 'translateX(50%)' : 'translateX(-50%)';
    }
    return local.inverted ? 'translateY(-50%)' : 'translateY(50%)';
  };

  const getValueFromPointer = (clientX: number, clientY: number): number => {
    const rect = cachedRect ?? rootEl!.getBoundingClientRect();
    cachedRect = rect;
    if (isHorizontal()) {
      const slidingFromLeft = !local.inverted;
      const input: [number, number] = [0, rect.width];
      const output: [number, number] = slidingFromLeft
        ? [local.min, local.max]
        : [local.max, local.min];
      return linearScale(input, output)(clientX - rect.left);
    }
    const slidingFromBottom = !local.inverted;
    const input: [number, number] = [0, rect.height];
    // Pointer Y grows downward, so the not-inverted (`from-bottom`)
    // mapping flips to `[max, min]` to keep the bottom of the rail
    // aligned with the minimum value.
    const output: [number, number] = slidingFromBottom
      ? [local.max, local.min]
      : [local.min, local.max];
    return linearScale(input, output)(clientY - rect.top);
  };

  const updateValues = (
    rawValue: number,
    atIndex: number,
    commit = false,
  ): void => {
    const decimals = getDecimalCount(local.step);
    const stepped = roundValue(
      Math.round((rawValue - local.min) / local.step) * local.step + local.min,
      decimals,
    );
    const next = clamp(stepped, local.min, local.max);
    const nextValues = getNextSortedValues(local.value, next, atIndex);

    if (
      !hasMinStepsBetweenValues(
        nextValues,
        local.minStepsBetweenThumbs * local.step,
      )
    ) {
      return;
    }

    valueIndexToChange = nextValues.indexOf(next);
    const changed = !arraysEqual(nextValues, local.value);
    if (!changed) return;

    local.onValueChange(nextValues);
    if (commit) local.onValueCommit?.(nextValues);
    // Refocus after the parent renders the sorted array — keeps focus
    // on the thumb the user is dragging even when sort order changes.
    // The `isConnected` guard skips the call if the parent rejected
    // our update or shrank `value` past `valueIndexToChange`.
    queueMicrotask(() => {
      const thumb = thumbRefs[valueIndexToChange];
      if (thumb?.isConnected) thumb.focus();
    });
  };

  const onPointerDown: JSX.EventHandler<HTMLSpanElement, PointerEvent> = (
    event,
  ) => {
    if (typeof local.onPointerDown === 'function') local.onPointerDown(event);
    if (event.defaultPrevented) return;
    if (local.disabled) return;

    const target = event.target as HTMLElement;
    target.setPointerCapture(event.pointerId);
    // Suppress the browser's own focus pass — we focus the moved
    // thumb manually after the value updates.
    event.preventDefault();

    valuesBeforeSlideStart = local.value.slice();

    if (thumbRefs.includes(target)) {
      target.focus();
      // Pin the change index so a subsequent move slides the thumb the
      // user actually grabbed, even before any value lands.
      const grabbedIndex = thumbRefs.indexOf(target);
      if (grabbedIndex !== -1) valueIndexToChange = grabbedIndex;
      return;
    }

    const value = getValueFromPointer(event.clientX, event.clientY);
    const closest = getClosestValueIndex(local.value, value);
    updateValues(value, closest);
  };

  const onPointerMove: JSX.EventHandler<HTMLSpanElement, PointerEvent> = (
    event,
  ) => {
    if (typeof local.onPointerMove === 'function') local.onPointerMove(event);
    if (event.defaultPrevented) return;

    const target = event.target as HTMLElement;
    if (!target.hasPointerCapture(event.pointerId)) return;
    if (local.disabled) return;

    const value = getValueFromPointer(event.clientX, event.clientY);
    updateValues(value, valueIndexToChange);
  };

  const onPointerUp: JSX.EventHandler<HTMLSpanElement, PointerEvent> = (
    event,
  ) => {
    if (typeof local.onPointerUp === 'function') local.onPointerUp(event);
    if (event.defaultPrevented) return;

    const target = event.target as HTMLElement;
    if (!target.hasPointerCapture(event.pointerId)) return;
    target.releasePointerCapture(event.pointerId);
    cachedRect = undefined;

    if (local.disabled) return;
    const before = valuesBeforeSlideStart[valueIndexToChange];
    const after = local.value[valueIndexToChange];
    if (before !== after) local.onValueCommit?.(local.value);
  };

  const onKeyDown: JSX.EventHandler<HTMLSpanElement, KeyboardEvent> = (
    event,
  ) => {
    if (typeof local.onKeyDown === 'function') local.onKeyDown(event);
    if (event.defaultPrevented) return;
    if (local.disabled) return;

    // Read the active thumb from the event target rather than the
    // `onFocus`-cached index. Keyboard events bubble from the focused
    // thumb to the root, so `event.target` is the authoritative
    // source. If the event arrives on the root (no thumb focused),
    // skip — there's nothing to operate on.
    const targetIndex = thumbRefs.indexOf(event.target as HTMLElement);
    if (targetIndex === -1) return;

    // Home/End operate on the focused thumb per the W3C multi-thumb
    // slider pattern. Radix's primitive hardcodes index 0/last; we
    // diverge to match the spec — pressing End on the minimum thumb
    // shouldn't slingshot the maximum thumb.
    if (event.key === 'Home') {
      updateValues(local.min, targetIndex, true);
      event.preventDefault();
      return;
    }
    if (event.key === 'End') {
      updateValues(local.max, targetIndex, true);
      event.preventDefault();
      return;
    }
    if (PAGE_KEYS.includes(event.key) || ARROW_KEYS.includes(event.key)) {
      const stepDir = getStepDirection(
        event.key,
        local.orientation,
        local.inverted,
      );
      const isPageKey = PAGE_KEYS.includes(event.key);
      const isSkipKey =
        isPageKey || (event.shiftKey && ARROW_KEYS.includes(event.key));
      const multiplier = isSkipKey ? 10 : 1;
      const currentValue = local.value[targetIndex];
      if (currentValue === undefined) return;
      updateValues(
        currentValue + local.step * multiplier * stepDir,
        targetIndex,
        true,
      );
      event.preventDefault();
    }
  };

  const className = (): string =>
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

  const percent = (value: number): number =>
    convertValueToPercentage(value, local.min, local.max);

  // `:where()` is doing the heavy lifting in `slider.css` — these
  // attributes are the predicates it reads.
  const rangeStyle = (): JSX.CSSProperties => {
    const valuesCount = local.value.length;
    const percentages = local.value.map((value) => percent(value));
    const offsetStart = valuesCount > 1 ? Math.min(...percentages) : 0;
    const offsetEnd = 100 - Math.max(...percentages);
    return {
      [startEdge()]: `${offsetStart}%`,
      [endEdge()]: `${offsetEnd}%`,
    };
  };

  const formName = (): string | undefined => {
    if (!local.name) return undefined;
    return local.value.length > 1 ? `${local.name}[]` : local.name;
  };

  return (
    <span
      {...skeletonProps}
      ref={(el) => {
        rootEl = el;
      }}
      class={className()}
      data-testid={tid.testId}
      data-orientation={local.orientation}
      aria-disabled={local.disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <span class={css.track}>
        <span class={css.range} style={rangeStyle()} />
      </span>
      <Index each={local.value}>
        {(value, index) => (
          <span
            ref={(el) => {
              thumbRefs[index] = el;
            }}
            class={css.thumb}
            role="slider"
            tabIndex={local.disabled ? undefined : 0}
            aria-label={getThumbLabel(index, local.value.length)}
            aria-valuemin={local.min}
            aria-valuenow={value()}
            aria-valuemax={local.max}
            aria-orientation={local.orientation}
            aria-disabled={local.disabled || undefined}
            data-index={index}
            style={{
              [startEdge()]: `${percent(value())}%`,
              transform: thumbTransform(),
            }}
            onFocus={() => {
              valueIndexToChange = index;
            }}
          />
        )}
      </Index>
      <Show when={local.name && !local.disabled && !local.skeleton}>
        <Index each={local.value}>
          {(value) => (
            <input
              type="hidden"
              name={formName()}
              value={String(value())}
              form={local.form}
            />
          )}
        </Index>
      </Show>
    </span>
  );
};

export default Slider;

// --- Pure helpers ---

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const linearScale =
  (input: readonly [number, number], output: readonly [number, number]) =>
  (value: number): number => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };

const getDecimalCount = (value: number): number =>
  (String(value).split('.')[1] || '').length;

const roundValue = (value: number, decimalCount: number): number => {
  const rounder = 10 ** decimalCount;
  return Math.round(value * rounder) / rounder;
};

const convertValueToPercentage = (
  value: number,
  min: number,
  max: number,
): number => {
  const span = max - min;
  if (span === 0) return 0;
  const percentage = ((value - min) / span) * 100;
  return clamp(percentage, 0, 100);
};

const getNextSortedValues = (
  prev: number[],
  nextValue: number,
  atIndex: number,
): number[] => {
  const next = [...prev];
  next[atIndex] = nextValue;
  return next.sort((first, second) => first - second);
};

const getClosestValueIndex = (values: number[], target: number): number => {
  if (values.length <= 1) return 0;
  let closestIndex = 0;
  let closestDistance = Math.abs(values[0] - target);
  for (let index = 1; index < values.length; index++) {
    const distance = Math.abs(values[index] - target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }
  return closestIndex;
};

const hasMinStepsBetweenValues = (
  values: number[],
  minStepsBetween: number,
): boolean => {
  if (minStepsBetween <= 0) return true;
  for (let index = 0; index < values.length - 1; index++) {
    if (values[index + 1] - values[index] < minStepsBetween) return false;
  }
  return true;
};

const arraysEqual = (first: number[], second: number[]): boolean => {
  if (first.length !== second.length) return false;
  for (let index = 0; index < first.length; index++) {
    if (first[index] !== second[index]) return false;
  }
  return true;
};

const getThumbLabel = (index: number, total: number): string | undefined => {
  if (total > 2) return `Value ${index + 1} of ${total}`;
  if (total === 2) return ['Minimum', 'Maximum'][index];
  return undefined;
};

const getStepDirection = (
  key: string,
  orientation: SliderOrientation,
  inverted: boolean,
): number => {
  // Mirrors Radix's `BACK_KEYS` table for the four orientation-x-
  // direction combinations we model. Inlined here because the lookup
  // is small and stays close to the keyboard handler.
  let backKeys: string[];
  if (orientation === 'horizontal') {
    backKeys = inverted
      ? ['Home', 'PageDown', 'ArrowDown', 'ArrowRight']
      : ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'];
  } else {
    backKeys = inverted
      ? ['Home', 'PageDown', 'ArrowUp', 'ArrowLeft']
      : ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'];
  }
  return backKeys.includes(key) ? -1 : 1;
};
