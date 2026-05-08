/**
 * Behavioral tests for ScrollArea.
 *
 * The scrollbars are sized off live `ResizeObserver` measurements
 * and a `requestAnimationFrame`-batched layout read, so the real
 * browser is the only place these transitions actually fire — JSDOM
 * doesn't run layout and would let an overflow-driven regression
 * slip through silently.
 */

import { render, screen, waitFor } from '@solidjs/testing-library';
import type { JSX } from 'solid-js';
import ScrollArea, { type ScrollAreaProps } from '../scroll-area';
import * as fixture from './scroll-area.test.browser.css';

/** Fixed-size frame so overflow is a function of `children` alone. */
const Frame = (props: { children: JSX.Element }) => (
  <div class={fixture.frame}>{props.children}</div>
);

/**
 * Block much taller and wider than the surrounding frame, so both
 * axes overflow.
 */
const OverflowingContent = () => <div class={fixture.overflow}>overflow</div>;

/** Render a ScrollArea inside the standard 200x200 frame. */
const renderArea = (props: Omit<ScrollAreaProps, 'children'> = {}) =>
  render(() => (
    <Frame>
      <ScrollArea {...props}>
        <OverflowingContent />
      </ScrollArea>
    </Frame>
  ));

const getRoot = () => screen.getByTestId('sa');
const getViewport = () => {
  const child = getRoot().firstElementChild;
  if (!(child instanceof HTMLDivElement)) {
    throw new Error('ScrollArea viewport not found');
  }
  return child;
};
const getScrollbar = (orientation: 'horizontal' | 'vertical') => {
  // Scrollbar tracks live as direct children of the root, never
  // nested inside another scrollbar — a top-level
  // `[data-orientation]` query is unambiguous.
  const els = getRoot().querySelectorAll<HTMLDivElement>(
    `:scope > [data-orientation="${orientation}"]`,
  );
  return els[0] ?? null;
};

/** Wait one frame so ResizeObserver + the rAF measure can land. */
const flushMeasurement = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

describe('ScrollArea', () => {
  // --- DOM shape ---

  it('renders a viewport that owns the scrollable surface', () => {
    renderArea({ testId: 'sa' });
    const viewport = getViewport();
    // Native scrollbars are hidden via CSS; the viewport itself
    // still scrolls.
    expect(getComputedStyle(viewport).overflowX).toBe('scroll');
    expect(getComputedStyle(viewport).overflowY).toBe('scroll');
  });

  it('renders both scrollbars when scrollbars="both"', async () => {
    renderArea({ testId: 'sa' });
    await flushMeasurement();
    expect(getScrollbar('horizontal')).not.toBeNull();
    expect(getScrollbar('vertical')).not.toBeNull();
  });

  // --- Axis gating ---

  it('omits the horizontal scrollbar when scrollbars="vertical"', () => {
    renderArea({ testId: 'sa', scrollbars: 'vertical' });
    expect(getScrollbar('horizontal')).toBeNull();
    expect(getScrollbar('vertical')).not.toBeNull();
  });

  it('omits the vertical scrollbar when scrollbars="horizontal"', () => {
    renderArea({ testId: 'sa', scrollbars: 'horizontal' });
    expect(getScrollbar('vertical')).toBeNull();
    expect(getScrollbar('horizontal')).not.toBeNull();
  });

  it('locks the cross-axis overflow to hidden when one axis is disabled', () => {
    renderArea({ testId: 'sa', scrollbars: 'vertical' });
    const viewport = getViewport();
    expect(getComputedStyle(viewport).overflowX).toBe('hidden');
    expect(getComputedStyle(viewport).overflowY).toBe('scroll');
  });

  // --- Visibility variants ---

  it('keeps scrollbars visible without overflow when type="always"', async () => {
    render(() => (
      <Frame>
        <ScrollArea testId="sa" type="always">
          <div>nothing to scroll</div>
        </ScrollArea>
      </Frame>
    ));
    await flushMeasurement();
    const track = getScrollbar('vertical');
    // Track is mounted and visible regardless of overflow.
    expect(track).toHaveAttribute('data-state', 'visible');
    // But the thumb only renders when content overflows — empty
    // tracks have no thumb child.
    expect(track?.children.length).toBe(0);
  });

  it('shows a thumb under type="always" once content overflows', async () => {
    renderArea({ testId: 'sa', type: 'always' });
    await flushMeasurement();
    await waitFor(() => {
      expect(getScrollbar('vertical')?.children.length).toBe(1);
    });
  });

  it('shows scrollbars when type="auto" and content overflows', async () => {
    renderArea({ testId: 'sa', type: 'auto' });
    await flushMeasurement();
    await waitFor(() => {
      expect(getScrollbar('vertical')).toHaveAttribute('data-state', 'visible');
      expect(getScrollbar('horizontal')).toHaveAttribute(
        'data-state',
        'visible',
      );
    });
  });

  it('hides scrollbars when type="auto" and content fits', async () => {
    render(() => (
      <Frame>
        <ScrollArea testId="sa" type="auto">
          <div>fits</div>
        </ScrollArea>
      </Frame>
    ));
    await flushMeasurement();
    expect(getScrollbar('vertical')).toHaveAttribute('data-state', 'hidden');
    expect(getScrollbar('horizontal')).toHaveAttribute('data-state', 'hidden');
  });

  // --- Prop forwarding ---

  it('attaches role/aria-label/tabIndex to the viewport, not the root', () => {
    renderArea({
      testId: 'sa',
      role: 'region',
      'aria-label': 'Scrolling region',
      tabIndex: 0,
    });
    const root = getRoot();
    const viewport = getViewport();
    // Viewport carries the semantic surface — keyboard arrow scroll
    // and screen-reader landmark live there.
    expect(viewport).toHaveAttribute('role', 'region');
    expect(viewport).toHaveAttribute('aria-label', 'Scrolling region');
    expect(viewport).toHaveAttribute('tabindex', '0');
    // Root keeps the testId and the wrapper class but stays
    // semantically silent.
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('aria-label');
    expect(root).not.toHaveAttribute('tabindex');
  });

  it('keeps the consumer class on the root, off the viewport', () => {
    renderArea({ testId: 'sa', class: fixture.consumerMinHeight });
    const root = getRoot();
    const viewport = getViewport();
    expect(root.className).toContain(fixture.consumerMinHeight);
    expect(viewport.className).not.toContain(fixture.consumerMinHeight);
  });

  it('fires consumer onScroll when the viewport scrolls', async () => {
    const handler = vi.fn();
    render(() => (
      <Frame>
        <ScrollArea testId="sa" onScroll={handler}>
          <OverflowingContent />
        </ScrollArea>
      </Frame>
    ));
    await flushMeasurement();
    const viewport = getViewport();
    viewport.scrollTop = 50;
    await waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });
  });

  // --- Focus ring ---

  it('renders the focus-ring overlay as a sibling of the viewport', () => {
    renderArea({ testId: 'sa' });
    // Sibling order: viewport, focus ring, scrollbars.
    const focusRing = getRoot().children[1];
    expect(focusRing).toBeTruthy();
    expect(focusRing).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes the viewport as a focusable surface when tabIndex is set', () => {
    renderArea({ testId: 'sa', tabIndex: 0 });
    const viewport = getViewport();
    viewport.focus();
    expect(viewport).toHaveFocus();
  });

  // --- Drag interaction ---
  //
  // Drag flow synthesizes pointer events directly on the scrollbar
  // track. The handler binds move/finish listeners to the scrollbar
  // element (the pointerdown's `currentTarget`), so dispatching the
  // chain on that same element matches what real pointer capture
  // would deliver.

  /** Single shared pointerId so capture state stays consistent across the chain. */
  const POINTER_ID = 1;

  const dispatchPointer = (
    target: HTMLElement,
    type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
    init: { clientX: number; clientY: number; relatedTarget?: HTMLElement },
  ) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: POINTER_ID,
        pointerType: 'mouse',
        ...init,
      }),
    );

  it('drags the vertical thumb to scroll the viewport down', async () => {
    renderArea({ testId: 'sa', type: 'always' });
    await flushMeasurement();
    const viewport = getViewport();
    const track = getScrollbar('vertical');
    if (!track) throw new Error('vertical track missing');
    const thumb = track.children[0];
    if (!(thumb instanceof HTMLDivElement)) {
      throw new Error('vertical thumb missing');
    }
    const thumbRect = thumb.getBoundingClientRect();
    // Press on the thumb's center, then drag 60px downward. The
    // exact translated scroll distance depends on track/content
    // ratios; we only need scrollTop to have moved meaningfully.
    const startY = thumbRect.top + thumbRect.height / 2;
    const trackRect = track.getBoundingClientRect();
    const trackCenterX = trackRect.left + trackRect.width / 2;
    dispatchPointer(track, 'pointerdown', {
      clientX: trackCenterX,
      clientY: startY,
    });
    dispatchPointer(track, 'pointermove', {
      clientX: trackCenterX,
      clientY: startY + 60,
    });
    dispatchPointer(track, 'pointerup', {
      clientX: trackCenterX,
      clientY: startY + 60,
    });
    expect(viewport.scrollTop).toBeGreaterThan(0);
  });

  it('drags the horizontal thumb to scroll the viewport right', async () => {
    renderArea({ testId: 'sa', type: 'always' });
    await flushMeasurement();
    const viewport = getViewport();
    const track = getScrollbar('horizontal');
    if (!track) throw new Error('horizontal track missing');
    const thumb = track.children[0];
    if (!(thumb instanceof HTMLDivElement)) {
      throw new Error('horizontal thumb missing');
    }
    const thumbRect = thumb.getBoundingClientRect();
    const startX = thumbRect.left + thumbRect.width / 2;
    const trackRect = track.getBoundingClientRect();
    const trackCenterY = trackRect.top + trackRect.height / 2;
    dispatchPointer(track, 'pointerdown', {
      clientX: startX,
      clientY: trackCenterY,
    });
    dispatchPointer(track, 'pointermove', {
      clientX: startX + 60,
      clientY: trackCenterY,
    });
    dispatchPointer(track, 'pointerup', {
      clientX: startX + 60,
      clientY: trackCenterY,
    });
    expect(viewport.scrollLeft).toBeGreaterThan(0);
  });

  it('jumps the thumb to the cursor on a track click outside the thumb', async () => {
    renderArea({ testId: 'sa', type: 'always' });
    await flushMeasurement();
    const viewport = getViewport();
    const track = getScrollbar('vertical');
    if (!track) throw new Error('vertical track missing');
    const trackRect = track.getBoundingClientRect();
    // Press near the bottom of the empty track. With no thumb under
    // the cursor, `pointerOffset` stays null and the handler centers
    // the thumb on the click — so scrollTop snaps deep into the
    // overflow instead of inching forward.
    const trackCenterX = trackRect.left + trackRect.width / 2;
    const trackBottom = trackRect.bottom - 5;
    dispatchPointer(track, 'pointerdown', {
      clientX: trackCenterX,
      clientY: trackBottom,
    });
    dispatchPointer(track, 'pointerup', {
      clientX: trackCenterX,
      clientY: trackBottom,
    });
    expect(viewport.scrollTop).toBeGreaterThan(50);
  });

  it('preserves scrollTop when the press lands on the thumb leading edge', async () => {
    renderArea({ testId: 'sa', type: 'always' });
    await flushMeasurement();
    const viewport = getViewport();
    // Pre-scroll so the thumb sits well below the track's top.
    viewport.scrollTop = 200;
    await flushMeasurement();
    const track = getScrollbar('vertical');
    if (!track) throw new Error('vertical track missing');
    const thumb = track.children[0];
    if (!(thumb instanceof HTMLDivElement)) {
      throw new Error('vertical thumb missing');
    }
    const thumbRect = thumb.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    // Press exactly on the thumb's leading edge — dispatch on the
    // thumb so `event.target` matches the thumb element and the
    // handler records `pointerOffset = 0` (numeric, not the "no
    // thumb hit" sentinel `null`). Without the `?? thumbCenter`
    // fix, this would fall back to thumb-center alignment and snap
    // scrollTop back by ~half a thumb.
    const trackCenterX = trackRect.left + trackRect.width / 2;
    const thumbTopY = thumbRect.top;
    const before = viewport.scrollTop;
    dispatchPointer(thumb, 'pointerdown', {
      clientX: trackCenterX,
      clientY: thumbTopY,
    });
    dispatchPointer(track, 'pointerup', {
      clientX: trackCenterX,
      clientY: thumbTopY,
    });
    // 1px tolerance for sub-pixel scroll positions.
    expect(Math.abs(viewport.scrollTop - before)).toBeLessThan(2);
  });

  it('restores scroll-behavior on pointercancel mid-drag', async () => {
    renderArea({ testId: 'sa', type: 'always' });
    await flushMeasurement();
    const viewport = getViewport();
    // Stamp a sentinel scroll-behavior on the viewport so we can
    // observe whether the drag teardown restored it.
    viewport.style.scrollBehavior = 'smooth';
    const track = getScrollbar('vertical');
    if (!track) throw new Error('vertical track missing');
    const thumb = track.children[0];
    if (!(thumb instanceof HTMLDivElement)) {
      throw new Error('vertical thumb missing');
    }
    const thumbRect = thumb.getBoundingClientRect();
    const thumbCenterX = thumbRect.left + thumbRect.width / 2;
    const thumbCenterY = thumbRect.top + thumbRect.height / 2;
    dispatchPointer(track, 'pointerdown', {
      clientX: thumbCenterX,
      clientY: thumbCenterY,
    });
    // Mid-drag: scrollBehavior is forced to 'auto'.
    expect(viewport.style.scrollBehavior).toBe('auto');
    // Cancellation (touch interruption, tab switch) must still
    // restore the prior value — not just `pointerup`.
    dispatchPointer(track, 'pointercancel', {
      clientX: thumbCenterX,
      clientY: thumbCenterY,
    });
    expect(viewport.style.scrollBehavior).toBe('smooth');
  });
});
