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
 * - Wheel-on-horizontal-scrollbar falls back to `deltaY` when
 *   `deltaX` is zero. A vertical mouse wheel reports motion in
 *   `deltaY` regardless of which scrollbar the cursor is over;
 *   without the fallback, wheeling over the horizontal bar does
 *   nothing. Radix only consumes `deltaX`.
 * - Drag finishers also bind `pointercancel` and `lostpointercapture`
 *   so an interrupted drag (touch cancellation, browser tab switch,
 *   forced capture release) still restores `scroll-behavior` and
 *   detaches the move listener. Radix only listens for `pointerup`.
 * - `type='hover'` keeps the scrollbar visible while a drag is in
 *   progress, even if the pointer drifts off the root. Radix's hide
 *   timer can fade the bar out from under the user mid-drag.
 * - Drag save/restores the viewport's prior inline `scroll-behavior`
 *   instead of unconditionally clearing it on release. Preserves a
 *   consumer-set `scroll-behavior: smooth` outside the drag window;
 *   Radix overwrites it to `''`.
 * - No `ScrollAreaCorner` element. Radix paints a real DOM box at
 *   the bottom-right when both bars are visible; we compute corner
 *   clearance via cross-axis thickness vars but leave the corner
 *   transparent. Visually identical against neutral panels — drop a
 *   styled element back in if a consumer needs to color-match it.
 *
 * @see https://www.radix-ui.com/themes/docs/components/scroll-area
 * @see https://www.radix-ui.com/primitives/docs/components/scroll-area
 */

import {
  batch,
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
import {
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbRatio,
  getThumbSize,
  type Sizes,
} from './geometry';
import * as css from './scroll-area.css';

/** Scrollbar visibility behavior. */
export type ScrollAreaType = 'auto' | 'always' | 'hover' | 'scroll';
/** Visual size on a 1–3 scale. */
export type ScrollAreaSize = 1 | 2 | 3;
/** Corner rounding for the scrollbar track. */
export type ScrollAreaRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
/** Which axes can scroll. */
export type ScrollAreaScrollbars = 'vertical' | 'horizontal' | 'both';

const ZERO_SIZES: Sizes = {
  content: 0,
  viewport: 0,
  scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 },
};

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
   * fade-out after scrolling stops). Defaults to `600` for
   * `type='scroll'` and `0` otherwise.
   */
  scrollHideDelay?: number;
  /** Visual size on a 1–3 scale. @default 1 */
  size?: ScrollAreaSize;
  /** Corner rounding for the scrollbar track. @default 'full' */
  radius?: ScrollAreaRadius;
  /** Which axes can scroll. @default 'both' */
  scrollbars?: ScrollAreaScrollbars;
}

/** Per-scrollbar wiring shared between the X and Y axes. */
interface ScrollbarProps {
  axis: 'x' | 'y';
  /** Whether the track should fade in. */
  visible: boolean;
  /** Whether content overflows enough to justify a thumb. */
  hasThumb: boolean;
  /** Thumb length along the scroll axis in pixels. */
  thumbSize: number;
  /** Cross-axis clearance for the perpendicular scrollbar (px). */
  cornerSize: number;
  /**
   * Hand the track element back to the parent for measurement. The
   * cleanup pass nulls the signal so the parent's ResizeObserver
   * effect re-runs and detaches when this scrollbar unmounts.
   */
  ref: (el: HTMLDivElement | null) => void;
  /** Hand the thumb element back to the parent for transform writes. */
  thumbRef: (el: HTMLDivElement | undefined) => void;
  onPointerDown: (event: PointerEvent) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

/**
 * Single scrollbar track + thumb. Local to the component so it
 * stays a private layout detail — the parent owns the signals and
 * effects, this just paints the result and forwards events.
 */
const Scrollbar = (props: ScrollbarProps) => {
  const orientation = () => (props.axis === 'x' ? 'horizontal' : 'vertical');
  const cornerVar = () =>
    props.axis === 'x' ? css.cornerWidth : css.cornerHeight;
  const thumbDimensionStyle = (): JSX.CSSProperties =>
    props.axis === 'x'
      ? { width: `${props.thumbSize}px` }
      : { height: `${props.thumbSize}px` };

  return (
    <div
      ref={(el) => {
        props.ref(el);
        onCleanup(() => props.ref(null));
      }}
      class={css.scrollbar}
      data-orientation={orientation()}
      data-state={props.visible ? 'visible' : 'hidden'}
      style={assignInlineVars({ [cornerVar()]: `${props.cornerSize}px` })}
      onPointerDown={(event) => props.onPointerDown(event)}
      onPointerEnter={() => props.onPointerEnter()}
      onPointerLeave={() => props.onPointerLeave()}
    >
      <Show when={props.hasThumb}>
        <div
          ref={(el) => {
            props.thumbRef(el);
            onCleanup(() => props.thumbRef(undefined));
          }}
          class={css.thumb}
          data-orientation={orientation()}
          style={thumbDimensionStyle()}
        />
      </Show>
    </div>
  );
};

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
      size: 1 as const,
      radius: 'full' as const,
      scrollbars: 'both' as const,
    },
    rawProps,
  );

  // `scrollHideDelay` defaults split by `type`: 600ms when scrolling
  // is the trigger (so the bar lingers long enough to grab), 0ms
  // otherwise (hover already paces the fade by pointer position).
  // Mirrors Radix Themes' override of the primitive's flat 600ms.
  const scrollHideDelay = () =>
    props.scrollHideDelay !== undefined
      ? props.scrollHideDelay
      : props.type === 'scroll'
        ? 600
        : 0;

  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  // Wrapper-only props (`class`, `style`) stay on the root so margin
  // classes and consumer-supplied wrapper styles compose correctly.
  // Everything else — `aria-*`, `role`, `tabIndex`, `id`, native
  // event handlers like `onScroll` — forwards to the viewport so the
  // semantic and interactive surface is the scrolling region itself.
  const [local, viewportRest] = splitProps(withoutTid, [
    'type',
    'scrollHideDelay',
    'size',
    'radius',
    'scrollbars',
    'class',
    'style',
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
  // Tracks whether a scrollbar is being dragged so hover/scroll
  // visibility timers don't fade out the bar the user is grabbing
  // when their pointer drifts off the root.
  const [isDragging, setIsDragging] = createSignal(false);
  // Single timer for the hover-hide flow. Hoisted out of the hover
  // effect so the post-drag cleanup can also schedule and the next
  // pointerenter can cancel a pending hide.
  let hoverHideTimer = 0;
  const scheduleHoverHide = () => {
    window.clearTimeout(hoverHideTimer);
    hoverHideTimer = window.setTimeout(
      () => setHoverVisible(false),
      scrollHideDelay(),
    );
  };
  const cancelHoverHide = () => {
    window.clearTimeout(hoverHideTimer);
  };
  // Per-axis scroll-state machines. A vertical scroll must not light
  // up the horizontal bar (and vice versa), so each axis owns its own
  // state, SCROLL_END timer, and POINTER_* handling — mirroring
  // Radix's per-`ScrollAreaScrollbarScroll` ownership.
  const createAxisScrollState = () => {
    const [state, setState] = createSignal<ScrollState>('hidden');
    const send = (event: ScrollEvent) =>
      setState((current) => SCROLL_TRANSITIONS[current]?.[event] ?? current);
    return { state, send };
  };
  const scrollX = createAxisScrollState();
  const scrollY = createAxisScrollState();

  // Cross-axis thickness of each scrollbar — width of the vertical
  // bar, height of the horizontal bar. Drives corner clearance so the
  // two tracks don't overlap at the bottom-right.
  const [thicknessX, setThicknessX] = createSignal(0);
  const [thicknessY, setThicknessY] = createSignal(0);

  const isOverflowingX = () => sizesX().content > sizesX().viewport;
  const isOverflowingY = () => sizesY().content > sizesY().viewport;

  // Thumb only renders when content actually overflows. Mirrors
  // Radix's `hasThumb` gate so `type='always'` shows an empty track
  // (rather than a min-sized nub) when there's nothing to scroll.
  const hasThumbX = () => {
    const ratio = getThumbRatio(sizesX().viewport, sizesX().content);
    return ratio > 0 && ratio < 1;
  };
  const hasThumbY = () => {
    const ratio = getThumbRatio(sizesY().viewport, sizesY().content);
    return ratio > 0 && ratio < 1;
  };

  const visibleX = (): boolean => {
    if (!enableX()) return false;
    switch (local.type) {
      case 'always':
        return true;
      case 'auto':
        return isOverflowingX();
      case 'hover':
        return hoverVisible() && isOverflowingX();
      case 'scroll':
        return scrollX.state() !== 'hidden' && isOverflowingX();
    }
  };

  const visibleY = (): boolean => {
    if (!enableY()) return false;
    switch (local.type) {
      case 'always':
        return true;
      case 'auto':
        return isOverflowingY();
      case 'hover':
        return hoverVisible() && isOverflowingY();
      case 'scroll':
        return scrollY.state() !== 'hidden' && isOverflowingY();
    }
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
    const onEnter = () => {
      cancelHoverHide();
      setHoverVisible(true);
    };
    const onLeave = () => {
      // Skip the hide timer while a drag is in progress so the
      // pointer wandering off the root doesn't fade out the
      // scrollbar the user is still holding.
      if (isDragging()) return;
      scheduleHoverHide();
    };
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    onCleanup(() => {
      cancelHoverHide();
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
    });
  });

  // Scroll-state machine: visibility tracks scroll activity, with a
  // debounced SCROLL_END that kicks the state into `idle`. Each axis
  // is dispatched independently so a vertical scroll never lights up
  // the horizontal bar.
  createEffect(() => {
    if (local.type !== 'scroll') return;
    const viewport = viewportEl();
    if (!viewport) return;
    let scrollEndTimerX = 0;
    let scrollEndTimerY = 0;
    let prevLeft = viewport.scrollLeft;
    let prevTop = viewport.scrollTop;
    const onScroll = () => {
      const left = viewport.scrollLeft;
      const top = viewport.scrollTop;
      if (left !== prevLeft) {
        scrollX.send('SCROLL');
        window.clearTimeout(scrollEndTimerX);
        scrollEndTimerX = window.setTimeout(
          () => scrollX.send('SCROLL_END'),
          100,
        );
      }
      if (top !== prevTop) {
        scrollY.send('SCROLL');
        window.clearTimeout(scrollEndTimerY);
        scrollEndTimerY = window.setTimeout(
          () => scrollY.send('SCROLL_END'),
          100,
        );
      }
      prevLeft = left;
      prevTop = top;
    };
    viewport.addEventListener('scroll', onScroll);
    onCleanup(() => {
      window.clearTimeout(scrollEndTimerX);
      window.clearTimeout(scrollEndTimerY);
      viewport.removeEventListener('scroll', onScroll);
    });
  });

  // While an axis sits in `idle`, queue a HIDE event so the scrollbar
  // fades out after `scrollHideDelay`. One effect per axis so each
  // axis's idle window is timed independently.
  const trackHideTimer = (axis: typeof scrollX) => {
    createEffect(() => {
      if (local.type !== 'scroll') return;
      if (axis.state() !== 'idle') return;
      const timer = window.setTimeout(
        () => axis.send('HIDE'),
        scrollHideDelay(),
      );
      onCleanup(() => window.clearTimeout(timer));
    });
  };
  trackHideTimer(scrollX);
  trackHideTimer(scrollY);

  const measureSizes = () => {
    const viewport = viewportEl();
    if (!viewport) return;
    // Hoist DOM reads ahead of signal writes. The thumb-priming
    // effect subscribes to both `sizesX` and `sizesY` and writes
    // `transform` on the thumb — so an interleaved
    // setSizesX/read-Y/setSizesY pattern dirties layout between the
    // X and Y geometry reads, forcing a second sync layout flush.
    // Collect all reads first, then commit writes inside `batch`
    // so subscribers fire once after the read phase completes.
    let xMetrics: { sizes: Sizes; thickness: number } | null = null;
    let yMetrics: { sizes: Sizes; thickness: number } | null = null;
    if (enableX()) {
      const scrollbar = scrollbarXEl();
      const scrollbarStyle = scrollbar
        ? getComputedStyle(scrollbar)
        : undefined;
      xMetrics = {
        sizes: {
          content: viewport.scrollWidth,
          viewport: viewport.offsetWidth,
          scrollbar: {
            size: scrollbar?.clientWidth ?? 0,
            paddingStart: scrollbarStyle
              ? parseInt(scrollbarStyle.paddingLeft, 10) || 0
              : 0,
            paddingEnd: scrollbarStyle
              ? parseInt(scrollbarStyle.paddingRight, 10) || 0
              : 0,
          },
        },
        thickness: scrollbar?.clientHeight ?? 0,
      };
    }
    if (enableY()) {
      const scrollbar = scrollbarYEl();
      const scrollbarStyle = scrollbar
        ? getComputedStyle(scrollbar)
        : undefined;
      yMetrics = {
        sizes: {
          content: viewport.scrollHeight,
          viewport: viewport.offsetHeight,
          scrollbar: {
            size: scrollbar?.clientHeight ?? 0,
            paddingStart: scrollbarStyle
              ? parseInt(scrollbarStyle.paddingTop, 10) || 0
              : 0,
            paddingEnd: scrollbarStyle
              ? parseInt(scrollbarStyle.paddingBottom, 10) || 0
              : 0,
          },
        },
        thickness: scrollbar?.clientWidth ?? 0,
      };
    }
    batch(() => {
      if (xMetrics) {
        setSizesX(xMetrics.sizes);
        setThicknessX(xMetrics.thickness);
      }
      if (yMetrics) {
        setSizesY(yMetrics.sizes);
        setThicknessY(yMetrics.thickness);
      }
    });
  };

  // Observe viewport, content, and the scrollbar tracks. Any shape
  // change reschedules `measureSizes` on the next frame to amortize
  // multiple observations into a single layout read.
  createEffect(() => {
    const viewport = viewportEl();
    const content = contentEl();
    const scrollbarX = scrollbarXEl();
    const scrollbarY = scrollbarYEl();
    if (!viewport) return;
    let rAF = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(measureSizes);
    });
    observer.observe(viewport);
    if (content) observer.observe(content);
    if (scrollbarX) observer.observe(scrollbarX);
    if (scrollbarY) observer.observe(scrollbarY);
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
      // Read both axes' scroll positions before writing either
      // thumb's transform — interleaving (read X, write X, read Y,
      // write Y) forces a second layout flush.
      const xOffset =
        thumbXEl && enableX()
          ? getThumbOffsetFromScroll(viewport.scrollLeft, sizesX())
          : null;
      const yOffset =
        thumbYEl && enableY()
          ? getThumbOffsetFromScroll(viewport.scrollTop, sizesY())
          : null;
      if (thumbXEl && xOffset !== null) {
        thumbXEl.style.transform = `translate3d(${xOffset}px, 0, 0)`;
      }
      if (thumbYEl && yOffset !== null) {
        thumbYEl.style.transform = `translate3d(0, ${yOffset}px, 0)`;
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
    // Read both scroll positions before writing either transform —
    // interleaving forces a second sync layout flush each time
    // sizes change.
    const xOffset = thumbXEl
      ? getThumbOffsetFromScroll(viewport.scrollLeft, sizesX())
      : null;
    const yOffset = thumbYEl
      ? getThumbOffsetFromScroll(viewport.scrollTop, sizesY())
      : null;
    if (thumbXEl && xOffset !== null) {
      thumbXEl.style.transform = `translate3d(${xOffset}px, 0, 0)`;
    }
    if (thumbYEl && yOffset !== null) {
      thumbYEl.style.transform = `translate3d(0, ${yOffset}px, 0)`;
    }
  });

  // Wheel-on-scrollbar: bind a non-passive document listener so we can
  // both forward the delta to the viewport and `preventDefault` to
  // stop the page from scrolling out from under the cursor.
  createEffect(() => {
    const handler = (event: WheelEvent) => {
      const target = event.target as Node | null;
      const scrollbarX = scrollbarXEl();
      const scrollbarY = scrollbarYEl();
      const onX = scrollbarX && target && scrollbarX.contains(target);
      const onY = scrollbarY && target && scrollbarY.contains(target);
      const viewport = viewportEl();
      if (!viewport || (!onX && !onY)) return;
      if (onX) {
        // A vertical mouse wheel reports motion in `deltaY` even
        // when the user wheels over a horizontal scrollbar. Fall
        // back to `deltaY` so the gesture still moves the viewport.
        const sizes = sizesX();
        const next = viewport.scrollLeft + (event.deltaX || event.deltaY);
        viewport.scrollLeft = next;
        const max = sizes.content - sizes.viewport;
        if (next > 0 && next < max) event.preventDefault();
      } else {
        const sizes = sizesY();
        const next = viewport.scrollTop + event.deltaY;
        viewport.scrollTop = next;
        const max = sizes.content - sizes.viewport;
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

    const rect = target.getBoundingClientRect();
    const thumbEl = axis === 'x' ? thumbXEl : thumbYEl;

    // Capture the pointer's offset within the thumb when the press
    // lands on the thumb itself — including its `::before` hit-area
    // extension, which delegates events back to the thumb element.
    // Detecting via event target (rather than client-rect containment)
    // matches Radix's `onPointerDownCapture` on the thumb: clicks on
    // the hit-area record an offset so the thumb doesn't jump under
    // the cursor on small thumbs where the `::before` extends past
    // the visible bounds.
    let pointerOffset: number | null = null;
    if (thumbEl) {
      const eventTarget = event.target as Node | null;
      const onThumb =
        eventTarget !== null &&
        (eventTarget === thumbEl || thumbEl.contains(eventTarget));
      if (onThumb) {
        const thumbRect = thumbEl.getBoundingClientRect();
        pointerOffset =
          axis === 'x'
            ? event.clientX - thumbRect.left
            : event.clientY - thumbRect.top;
      }
    }

    // `scrollBehavior: 'auto'` overrides any consumer-set
    // `scroll-behavior: smooth` for the duration of the drag —
    // smooth scroll lags the cursor and feels broken when the user
    // is holding the thumb. Restore the prior value on release.
    const prevScrollBehavior = viewport.style.scrollBehavior;
    viewport.style.scrollBehavior = 'auto';
    setIsDragging(true);

    const apply = (clientPos: number) => {
      // Read sizes live each move so a mid-drag content resize
      // doesn't desync the thumb from the cursor.
      const sizes = axis === 'x' ? sizesX() : sizesY();
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

    // Closure flag, not `hasPointerCapture`. The capture API is
    // browser-stateful and refuses to track synthetic pointerIds in
    // tests, but the gate's purpose is just to ignore stray
    // `pointermove`s that arrive after teardown — a flag handles
    // that without depending on the browser's capture registry.
    // Matches Radix's `rectRef`-as-flag pattern.
    let active = true;

    const onMove = (moveEvent: PointerEvent) => {
      if (!active || moveEvent.pointerId !== event.pointerId) return;
      apply(axis === 'x' ? moveEvent.clientX : moveEvent.clientY);
    };
    const finish = (finishEvent: PointerEvent) => {
      if (finishEvent.pointerId !== event.pointerId) return;
      active = false;
      if (target.hasPointerCapture(finishEvent.pointerId))
        target.releasePointerCapture(finishEvent.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', finish);
      target.removeEventListener('pointercancel', finish);
      target.removeEventListener('lostpointercapture', finish);
      viewport.style.scrollBehavior = prevScrollBehavior;
      setIsDragging(false);
      // Pointer capture suppressed `pointerleave` on the root while
      // the drag was active. If the release lands outside the root,
      // schedule a hide via the shared timer so a subsequent
      // `pointerenter` can still cancel it; if it lands inside, the
      // next real pointer movement re-arms the timer.
      const root = rootEl();
      if (local.type === 'hover' && root) {
        const rootRect = root.getBoundingClientRect();
        const outside =
          finishEvent.clientX < rootRect.left ||
          finishEvent.clientX > rootRect.right ||
          finishEvent.clientY < rootRect.top ||
          finishEvent.clientY > rootRect.bottom;
        if (outside) scheduleHoverHide();
      }
    };
    target.addEventListener('pointermove', onMove);
    // Bind every termination event so an interrupted drag (touch
    // cancellation, browser tab switch, lost pointer capture) still
    // restores the body selection state and detaches the listeners.
    target.addEventListener('pointerup', finish);
    target.addEventListener('pointercancel', finish);
    target.addEventListener('lostpointercapture', finish);
  };

  const onScrollbarPointerEnter = (axis: 'x' | 'y') => {
    if (local.type === 'scroll') {
      (axis === 'x' ? scrollX : scrollY).send('POINTER_ENTER');
    }
  };
  const onScrollbarPointerLeave = (axis: 'x' | 'y') => {
    if (local.type === 'scroll') {
      (axis === 'x' ? scrollX : scrollY).send('POINTER_LEAVE');
    }
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

  return (
    <div
      ref={setRootEl}
      class={className()}
      style={local.style}
      data-testid={tid.testId}
    >
      <div
        ref={setViewportEl}
        {...viewportRest}
        class={css.viewport}
        style={{
          'overflow-x': enableX() ? 'scroll' : 'hidden',
          'overflow-y': enableY() ? 'scroll' : 'hidden',
        }}
      >
        <div ref={setContentEl} class={css.content}>
          {local.children}
        </div>
      </div>
      <div class={css.viewportFocusRing} aria-hidden="true" />
      <Show when={enableX()}>
        <Scrollbar
          axis="x"
          visible={visibleX()}
          hasThumb={hasThumbX()}
          thumbSize={getThumbSize(sizesX())}
          cornerSize={cornerWidth()}
          ref={setScrollbarXEl}
          thumbRef={(el: HTMLDivElement | undefined) => (thumbXEl = el)}
          onPointerDown={(event) => startDrag('x', event)}
          onPointerEnter={() => onScrollbarPointerEnter('x')}
          onPointerLeave={() => onScrollbarPointerLeave('x')}
        />
      </Show>
      <Show when={enableY()}>
        <Scrollbar
          axis="y"
          visible={visibleY()}
          hasThumb={hasThumbY()}
          thumbSize={getThumbSize(sizesY())}
          cornerSize={cornerHeight()}
          ref={setScrollbarYEl}
          thumbRef={(el: HTMLDivElement | undefined) => (thumbYEl = el)}
          onPointerDown={(event) => startDrag('y', event)}
          onPointerEnter={() => onScrollbarPointerEnter('y')}
          onPointerLeave={() => onScrollbarPointerLeave('y')}
        />
      </Show>
    </div>
  );
};

export default ScrollArea;
