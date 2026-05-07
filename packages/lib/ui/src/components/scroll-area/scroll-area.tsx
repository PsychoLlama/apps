/**
 * ScrollArea component.
 *
 * Ported from Radix UI Themes ScrollArea (which wraps the ScrollArea
 * primitive). Renders a viewport whose native scrollbars are hidden
 * and replaced with custom scrollbars positioned over the content.
 *
 * Deviations:
 * - Single component, no compound API. Themes already exposes a
 *   single `<ScrollArea>` and we keep that ergonomic — consumers
 *   reach for a styled overflow container, not five primitives.
 * - Drops `dir`/RTL handling. LTR everywhere; bidirectional support
 *   belongs in a follow-up once the rest of the system models direction.
 * - Drops `forceMount`/`Presence`. Hidden scrollbars stay mounted but
 *   are visually suppressed via `data-state="hidden"` (opacity zero,
 *   pointer-events off). No enter/exit animation indirection — a flat
 *   opacity transition stands in for Radix's keyframe fade pair.
 * - Drops `nonce`. The viewport hides native scrollbars from a sheet
 *   `.css.ts` rule instead of injecting an inline `<style>` tag.
 * - Drops the `color` prop. Scrollbars track the neutral palette so
 *   they stay legible against any panel.
 * - Drops `asChild`. The host is a tag-locked `<div>`.
 * - Wires `radius` straight through to the scrollbar's border-radius.
 *   Themes ships a dead `data-radius` attr that no rule consumes
 *   (all sizes hard-pin pill shape); we honor the prop instead.
 * - Drops Radix's `> * { display: block; width: fit-content }` reset
 *   on viewport children — VE bans the global selector and the
 *   project bans `globalStyle` in components. Consumers should wrap
 *   inline content in a block-level element if it needs to drive
 *   horizontal overflow.
 *
 * @see https://www.radix-ui.com/themes/docs/components/scroll-area
 * @see https://www.radix-ui.com/primitives/docs/components/scroll-area
 */

import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  Show,
  splitProps,
} from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './scroll-area.css';

/** Scrollbar visibility behavior. */
export type ScrollAreaType = 'auto' | 'always' | 'hover' | 'scroll';
/** Visual size on a 1–3 scale. */
export type ScrollAreaSize = 1 | 2 | 3;
/** Corner rounding for the scrollbar track. */
export type ScrollAreaRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
/** Which axes can scroll. */
export type ScrollAreaScrollbars = 'vertical' | 'horizontal' | 'both';

type Sizes = {
  /** Total scrollable extent of the content along the axis. */
  content: number;
  /** Visible extent of the viewport along the axis. */
  viewport: number;
  /** Scrollbar track metrics along the axis. */
  scrollbar: { size: number; paddingStart: number; paddingEnd: number };
};

const ZERO_SIZES: Sizes = {
  content: 0,
  viewport: 0,
  scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 },
};

// macOS minimum scrollbar thumb size — matches Radix's floor.
const MIN_THUMB_SIZE = 18;

type ScrollState = 'hidden' | 'scrolling' | 'idle' | 'interacting';
type ScrollEvent =
  | 'SCROLL'
  | 'SCROLL_END'
  | 'POINTER_ENTER'
  | 'POINTER_LEAVE'
  | 'HIDE';

const SCROLL_TRANSITIONS: Record<
  ScrollState,
  Partial<Record<ScrollEvent, ScrollState>>
> = {
  hidden: { SCROLL: 'scrolling' },
  scrolling: { SCROLL_END: 'idle', POINTER_ENTER: 'interacting' },
  interacting: { SCROLL: 'interacting', POINTER_LEAVE: 'idle' },
  idle: { HIDE: 'hidden', SCROLL: 'scrolling', POINTER_ENTER: 'interacting' },
};

/**
 * `ScrollArea` props. Surfaces native `<div>` attributes; takes
 * margin and `testId` from the standard prop bundles.
 */
export interface ScrollAreaProps
  extends
    MarginProps,
    TestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'dir'> {
  /** Visibility behavior. @default 'hover' */
  type?: ScrollAreaType;
  /**
   * Hide delay in milliseconds. Used by `type='hover'` (delay before
   * fade-out on pointerleave) and `type='scroll'` (delay before
   * fade-out after scrolling stops). @default 600
   */
  scrollHideDelay?: number;
  /** Visual size on a 1–3 scale. @default 1 */
  size?: ScrollAreaSize;
  /** Corner rounding for the scrollbar track. @default 'full' */
  radius?: ScrollAreaRadius;
  /** Which axes can scroll. @default 'both' */
  scrollbars?: ScrollAreaScrollbars;
}

/**
 * Styled overflow container with custom scrollbars. Drop content of
 * any size inside; the viewport scrolls and the scrollbars track
 * position. Constrain the area's size from the parent (height, max-
 * height, flex layout) — `<ScrollArea>` itself stretches to fill.
 */
const ScrollArea: ParentComponent<ScrollAreaProps> = (rawProps) => {
  const props = mergeProps(
    {
      type: 'hover' as const,
      scrollHideDelay: 600,
      size: 1 as const,
      radius: 'full' as const,
      scrollbars: 'both' as const,
    },
    rawProps,
  );

  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  // `onScroll` doesn't bubble, so a consumer-provided scroll handler
  // has to attach to the actual scrolling element — the viewport,
  // not the root.
  const [scrollHandlers, withoutScroll] = splitProps(withoutTid, ['onScroll']);
  const [local, rest] = splitProps(withoutScroll, [
    'type',
    'scrollHideDelay',
    'size',
    'radius',
    'scrollbars',
    'class',
    'children',
  ]);

  const [rootEl, setRootEl] = createSignal<HTMLDivElement | null>(null);
  const [viewportEl, setViewportEl] = createSignal<HTMLDivElement | null>(null);
  const [contentEl, setContentEl] = createSignal<HTMLDivElement | null>(null);
  const [scrollbarXEl, setScrollbarXEl] = createSignal<HTMLDivElement | null>(
    null,
  );
  const [scrollbarYEl, setScrollbarYEl] = createSignal<HTMLDivElement | null>(
    null,
  );
  let thumbXEl: HTMLDivElement | undefined;
  let thumbYEl: HTMLDivElement | undefined;

  const enableX = () => local.scrollbars !== 'vertical';
  const enableY = () => local.scrollbars !== 'horizontal';

  const [sizesX, setSizesX] = createSignal<Sizes>(ZERO_SIZES);
  const [sizesY, setSizesY] = createSignal<Sizes>(ZERO_SIZES);

  const [hoverVisible, setHoverVisible] = createSignal(false);
  const [scrollState, setScrollState] = createSignal<ScrollState>('hidden');
  const sendScroll = (event: ScrollEvent) =>
    setScrollState((state) => SCROLL_TRANSITIONS[state]?.[event] ?? state);

  // Cross-axis thickness of each scrollbar — width of the vertical
  // bar, height of the horizontal bar. Drives corner clearance so the
  // two tracks don't overlap at the bottom-right.
  const [thicknessX, setThicknessX] = createSignal(0);
  const [thicknessY, setThicknessY] = createSignal(0);

  const isOverflowingX = () => sizesX().content > sizesX().viewport;
  const isOverflowingY = () => sizesY().content > sizesY().viewport;

  const visibleX = (): boolean => {
    if (!enableX()) return false;
    if (local.type === 'always') return true;
    if (local.type === 'auto') return isOverflowingX();
    if (local.type === 'hover') return hoverVisible() && isOverflowingX();
    if (local.type === 'scroll')
      return scrollState() !== 'hidden' && isOverflowingX();
    return false;
  };

  const visibleY = (): boolean => {
    if (!enableY()) return false;
    if (local.type === 'always') return true;
    if (local.type === 'auto') return isOverflowingY();
    if (local.type === 'hover') return hoverVisible() && isOverflowingY();
    if (local.type === 'scroll')
      return scrollState() !== 'hidden' && isOverflowingY();
    return false;
  };

  // Corner sizes feed scrollbar offsets so the two axes don't
  // overlap. The horizontal scrollbar's `right` clears the vertical
  // bar's *thickness* (its width); the vertical scrollbar's `bottom`
  // clears the horizontal bar's *thickness* (its height).
  const cornerWidth = () => (visibleY() ? thicknessY() : 0);
  const cornerHeight = () => (visibleX() ? thicknessX() : 0);

  // Hover visibility — pointerenter shows, pointerleave starts a hide
  // timer pinned to `scrollHideDelay`.
  createEffect(() => {
    if (local.type !== 'hover') return;
    const root = rootEl();
    if (!root) return;
    let hideTimer = 0;
    const onEnter = () => {
      window.clearTimeout(hideTimer);
      setHoverVisible(true);
    };
    const onLeave = () => {
      hideTimer = window.setTimeout(
        () => setHoverVisible(false),
        local.scrollHideDelay,
      );
    };
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    onCleanup(() => {
      window.clearTimeout(hideTimer);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
    });
  });

  // Scroll-state machine: visibility tracks scroll activity, with a
  // debounced SCROLL_END that kicks the state into `idle`.
  createEffect(() => {
    if (local.type !== 'scroll') return;
    const viewport = viewportEl();
    if (!viewport) return;
    let scrollEndTimer = 0;
    let prevLeft = viewport.scrollLeft;
    let prevTop = viewport.scrollTop;
    const onScroll = () => {
      const left = viewport.scrollLeft;
      const top = viewport.scrollTop;
      if (left !== prevLeft || top !== prevTop) {
        sendScroll('SCROLL');
        window.clearTimeout(scrollEndTimer);
        scrollEndTimer = window.setTimeout(() => sendScroll('SCROLL_END'), 100);
      }
      prevLeft = left;
      prevTop = top;
    };
    viewport.addEventListener('scroll', onScroll);
    onCleanup(() => {
      window.clearTimeout(scrollEndTimer);
      viewport.removeEventListener('scroll', onScroll);
    });
  });

  // While the state machine sits in `idle`, queue a HIDE event so the
  // scrollbar fades out after `scrollHideDelay`.
  createEffect(() => {
    if (local.type !== 'scroll') return;
    if (scrollState() !== 'idle') return;
    const timer = window.setTimeout(
      () => sendScroll('HIDE'),
      local.scrollHideDelay,
    );
    onCleanup(() => window.clearTimeout(timer));
  });

  const measureSizes = () => {
    const viewport = viewportEl();
    if (!viewport) return;
    if (enableX()) {
      const sb = scrollbarXEl();
      const sbStyle = sb ? getComputedStyle(sb) : undefined;
      setSizesX({
        content: viewport.scrollWidth,
        viewport: viewport.offsetWidth,
        scrollbar: {
          size: sb?.clientWidth ?? 0,
          paddingStart: sbStyle ? parseInt(sbStyle.paddingLeft, 10) || 0 : 0,
          paddingEnd: sbStyle ? parseInt(sbStyle.paddingRight, 10) || 0 : 0,
        },
      });
      setThicknessX(sb?.clientHeight ?? 0);
    }
    if (enableY()) {
      const sb = scrollbarYEl();
      const sbStyle = sb ? getComputedStyle(sb) : undefined;
      setSizesY({
        content: viewport.scrollHeight,
        viewport: viewport.offsetHeight,
        scrollbar: {
          size: sb?.clientHeight ?? 0,
          paddingStart: sbStyle ? parseInt(sbStyle.paddingTop, 10) || 0 : 0,
          paddingEnd: sbStyle ? parseInt(sbStyle.paddingBottom, 10) || 0 : 0,
        },
      });
      setThicknessY(sb?.clientWidth ?? 0);
    }
  };

  // Observe viewport, content, and the scrollbar tracks. Any shape
  // change reschedules `measureSizes` on the next frame to amortize
  // multiple observations into a single layout read.
  createEffect(() => {
    const viewport = viewportEl();
    const content = contentEl();
    const sbX = scrollbarXEl();
    const sbY = scrollbarYEl();
    if (!viewport) return;
    let rAF = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(measureSizes);
    });
    observer.observe(viewport);
    if (content) observer.observe(content);
    if (sbX) observer.observe(sbX);
    if (sbY) observer.observe(sbY);
    onCleanup(() => {
      cancelAnimationFrame(rAF);
      observer.disconnect();
    });
  });

  // Re-measure when the size/radius variant changes — the scrollbar's
  // padding and rendered width depend on the active CSS variant.
  createEffect(() => {
    void local.size;
    void local.radius;
    queueMicrotask(measureSizes);
  });

  // Update thumb position from viewport scroll. Use rAF to avoid
  // scroll-linked layout work, mirroring Radix's "unlinked scroll
  // listener" trick.
  createEffect(() => {
    const viewport = viewportEl();
    if (!viewport) return;
    let rAF = 0;
    const update = () => {
      if (thumbXEl && enableX()) {
        const offset = getThumbOffsetFromScroll(viewport.scrollLeft, sizesX());
        thumbXEl.style.transform = `translate3d(${offset}px, 0, 0)`;
      }
      if (thumbYEl && enableY()) {
        const offset = getThumbOffsetFromScroll(viewport.scrollTop, sizesY());
        thumbYEl.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(update);
    };
    viewport.addEventListener('scroll', onScroll);
    update();
    onCleanup(() => {
      cancelAnimationFrame(rAF);
      viewport.removeEventListener('scroll', onScroll);
    });
  });

  // Re-prime thumb transforms when sizes change (resize, layout
  // shifts, mount). The scroll effect only fires on scroll events.
  createEffect(() => {
    const viewport = viewportEl();
    if (!viewport) return;
    if (thumbXEl) {
      const offset = getThumbOffsetFromScroll(viewport.scrollLeft, sizesX());
      thumbXEl.style.transform = `translate3d(${offset}px, 0, 0)`;
    }
    if (thumbYEl) {
      const offset = getThumbOffsetFromScroll(viewport.scrollTop, sizesY());
      thumbYEl.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
  });

  // Wheel-on-scrollbar: bind a non-passive document listener so we can
  // both forward the delta to the viewport and `preventDefault` to
  // stop the page from scrolling out from under the cursor.
  createEffect(() => {
    const handler = (event: WheelEvent) => {
      const target = event.target as Node | null;
      const sbX = scrollbarXEl();
      const sbY = scrollbarYEl();
      const onX = sbX && target && sbX.contains(target);
      const onY = sbY && target && sbY.contains(target);
      const viewport = viewportEl();
      if (!viewport || (!onX && !onY)) return;
      if (onX) {
        const sx = sizesX();
        const next = viewport.scrollLeft + event.deltaX;
        viewport.scrollLeft = next;
        const max = sx.content - sx.viewport;
        if (next > 0 && next < max) event.preventDefault();
      } else {
        const sy = sizesY();
        const next = viewport.scrollTop + event.deltaY;
        viewport.scrollTop = next;
        const max = sy.content - sy.viewport;
        if (next > 0 && next < max) event.preventDefault();
      }
    };
    document.addEventListener('wheel', handler, { passive: false });
    onCleanup(() => document.removeEventListener('wheel', handler));
  });

  // Drag-scroll: pointerdown on a scrollbar captures the pointer and
  // maps subsequent moves to viewport scroll positions. If the press
  // lands on the thumb, preserve the pointer's offset within the
  // thumb so the thumb doesn't jump under the cursor.
  const startDrag = (axis: 'x' | 'y', event: PointerEvent) => {
    if (event.button !== 0) return;
    const target = event.currentTarget as HTMLDivElement;
    const viewport = viewportEl();
    if (!viewport) return;
    target.setPointerCapture(event.pointerId);

    const sizes = axis === 'x' ? sizesX() : sizesY();
    const rect = target.getBoundingClientRect();
    const thumbEl = axis === 'x' ? thumbXEl : thumbYEl;

    let pointerOffset = 0;
    if (thumbEl) {
      const thumbRect = thumbEl.getBoundingClientRect();
      const within =
        axis === 'x'
          ? event.clientX >= thumbRect.left && event.clientX <= thumbRect.right
          : event.clientY >= thumbRect.top && event.clientY <= thumbRect.bottom;
      if (within) {
        pointerOffset =
          axis === 'x'
            ? event.clientX - thumbRect.left
            : event.clientY - thumbRect.top;
      }
    }

    // `userSelect: 'none'` covers Chromium and Firefox; Safari
    // historically required the `-webkit-` form to honor it during
    // active pointer capture, so we set both. Reach for the legacy
    // alias via `setProperty` to keep the TS deprecation lint quiet.
    const bodyStyle = document.body.style;
    const prevUserSelect = bodyStyle.userSelect;
    const prevWebkitUserSelect = bodyStyle.getPropertyValue(
      '-webkit-user-select',
    );
    bodyStyle.userSelect = 'none';
    bodyStyle.setProperty('-webkit-user-select', 'none');
    const prevScrollBehavior = viewport.style.scrollBehavior;
    viewport.style.scrollBehavior = 'auto';

    const apply = (clientPos: number) => {
      const localPos = clientPos - (axis === 'x' ? rect.left : rect.top);
      const scrollPos = getScrollPositionFromPointer(
        localPos,
        pointerOffset,
        sizes,
      );
      if (axis === 'x') viewport.scrollLeft = scrollPos;
      else viewport.scrollTop = scrollPos;
    };

    apply(axis === 'x' ? event.clientX : event.clientY);

    const onMove = (moveEvent: PointerEvent) => {
      if (!target.hasPointerCapture(moveEvent.pointerId)) return;
      apply(axis === 'x' ? moveEvent.clientX : moveEvent.clientY);
    };
    const finish = (finishEvent: PointerEvent) => {
      if (target.hasPointerCapture(finishEvent.pointerId))
        target.releasePointerCapture(finishEvent.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', finish);
      target.removeEventListener('pointercancel', finish);
      target.removeEventListener('lostpointercapture', finish);
      bodyStyle.userSelect = prevUserSelect;
      bodyStyle.setProperty('-webkit-user-select', prevWebkitUserSelect);
      viewport.style.scrollBehavior = prevScrollBehavior;
    };
    target.addEventListener('pointermove', onMove);
    // Bind every termination event so an interrupted drag (touch
    // cancellation, browser tab switch, lost pointer capture) still
    // restores the body selection state and detaches the listeners.
    target.addEventListener('pointerup', finish);
    target.addEventListener('pointercancel', finish);
    target.addEventListener('lostpointercapture', finish);
  };

  const onScrollbarPointerEnter = () => {
    if (local.type === 'scroll') sendScroll('POINTER_ENTER');
  };
  const onScrollbarPointerLeave = () => {
    if (local.type === 'scroll') sendScroll('POINTER_LEAVE');
  };

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.radiusVariant[local.radius],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const dataState = (visible: boolean) => (visible ? 'visible' : 'hidden');

  return (
    <div ref={setRootEl} class={className()} data-testid={tid.testId} {...rest}>
      <div
        ref={setViewportEl}
        class={css.viewport}
        style={{
          'overflow-x': enableX() ? 'scroll' : 'hidden',
          'overflow-y': enableY() ? 'scroll' : 'hidden',
        }}
        onScroll={scrollHandlers.onScroll}
      >
        <div ref={setContentEl} class={css.content}>
          {local.children}
        </div>
      </div>
      <Show when={enableX()}>
        <div
          ref={(el) => {
            setScrollbarXEl(el);
            onCleanup(() => setScrollbarXEl(null));
          }}
          class={css.scrollbar}
          data-orientation="horizontal"
          data-state={dataState(visibleX())}
          style={assignInlineVars({
            [css.cornerWidth]: `${cornerWidth()}px`,
          })}
          onPointerDown={(event) => startDrag('x', event)}
          onPointerEnter={onScrollbarPointerEnter}
          onPointerLeave={onScrollbarPointerLeave}
        >
          <div
            ref={(el) => (thumbXEl = el)}
            class={css.thumb}
            data-orientation="horizontal"
            style={{ width: `${getThumbSize(sizesX())}px` }}
          />
        </div>
      </Show>
      <Show when={enableY()}>
        <div
          ref={(el) => {
            setScrollbarYEl(el);
            onCleanup(() => setScrollbarYEl(null));
          }}
          class={css.scrollbar}
          data-orientation="vertical"
          data-state={dataState(visibleY())}
          style={assignInlineVars({
            [css.cornerHeight]: `${cornerHeight()}px`,
          })}
          onPointerDown={(event) => startDrag('y', event)}
          onPointerEnter={onScrollbarPointerEnter}
          onPointerLeave={onScrollbarPointerLeave}
        >
          <div
            ref={(el) => (thumbYEl = el)}
            class={css.thumb}
            data-orientation="vertical"
            style={{ height: `${getThumbSize(sizesY())}px` }}
          />
        </div>
      </Show>
    </div>
  );
};

export default ScrollArea;

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

const getThumbRatio = (viewport: number, content: number): number => {
  const ratio = viewport / content;
  return Number.isNaN(ratio) || !Number.isFinite(ratio) ? 0 : ratio;
};

const getThumbSize = (sizes: Sizes): number => {
  const ratio = getThumbRatio(sizes.viewport, sizes.content);
  const padding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
  const thumb = (sizes.scrollbar.size - padding) * ratio;
  return Math.max(thumb, MIN_THUMB_SIZE);
};

const getScrollPositionFromPointer = (
  pointerPos: number,
  pointerOffset: number,
  sizes: Sizes,
): number => {
  const thumbSize = getThumbSize(sizes);
  const thumbCenter = thumbSize / 2;
  const offset = pointerOffset || thumbCenter;
  const thumbOffsetFromEnd = thumbSize - offset;
  const minPointer = sizes.scrollbar.paddingStart + offset;
  const maxPointer =
    sizes.scrollbar.size - sizes.scrollbar.paddingEnd - thumbOffsetFromEnd;
  const maxScroll = sizes.content - sizes.viewport;
  return linearScale([minPointer, maxPointer], [0, maxScroll])(pointerPos);
};

const getThumbOffsetFromScroll = (scrollPos: number, sizes: Sizes): number => {
  const thumbSize = getThumbSize(sizes);
  const padding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
  const trackSize = sizes.scrollbar.size - padding;
  const maxScroll = sizes.content - sizes.viewport;
  const maxThumb = trackSize - thumbSize;
  const clamped = clamp(scrollPos, 0, Math.max(maxScroll, 0));
  return linearScale([0, maxScroll], [0, maxThumb])(clamped);
};
