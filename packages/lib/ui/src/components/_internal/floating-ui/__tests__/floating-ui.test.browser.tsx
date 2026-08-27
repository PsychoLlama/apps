/**
 * Geometry tests for the floating-ui primitive.
 *
 * Placement is pure CSS keyed off `data-side`/`data-align` and inline
 * offset vars, so the real browser is the only place the resulting
 * pixel positions can be asserted — JSDOM doesn't run layout.
 */

import { render, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import {
  FloatingContainer,
  anchor,
  type FloatingContainerProps,
  type TetherOptions,
} from '../floating-ui';
import * as css from '../floating-ui.css';
import * as fixture from './floating-ui.test.browser.css';

/** Unwrap a `createVar()` reference (`var(--x)`) to its property name. */
const varName = (reference: string) => reference.slice(4, -1);

/**
 * Pixel-grid comparison. Tethered coordinates are snapped to whole
 * device pixels, so exact equality with a fractional layout is wrong by
 * up to half a pixel by design.
 */
const expectNear = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

/** A flip-only tether: no sliding, no size measurement. */
const flipTether: TetherOptions = { shift: false, size: false };

/** A tethered surface bound to a fixed 100×100 anchor. */
const Tethered = (
  props: Omit<FloatingContainerProps, 'children' | 'class' | 'anchor'> & {
    stage: string;
    surface?: string;
  },
) => {
  const [anchorElement, setAnchorElement] = createSignal<HTMLElement>();

  return (
    <div class={props.stage}>
      <div
        ref={setAnchorElement}
        class={`${anchor} ${fixture.anchorBox}`}
        data-testid="anchor"
      >
        <FloatingContainer
          {...props}
          anchor={anchorElement()}
          class={props.surface ?? fixture.surface}
        >
          content
        </FloatingContainer>
      </div>
    </div>
  );
};

/** Render a tethered surface and wait for the first placement to land. */
const renderTethered = async (
  props: Omit<FloatingContainerProps, 'children' | 'class' | 'anchor'> & {
    stage: string;
    surface?: string;
  },
) => {
  const { container } = render(() => <Tethered {...props} />);
  const floating = container.querySelector<HTMLElement>('[data-side]')!;

  await waitFor(() => expect(floating).toHaveAttribute('data-tethered'));

  return {
    floating,
    anchorBox: container.querySelector('[data-testid="anchor"]')!,
    arrow: container.querySelector('svg'),
  };
};

/** Render a surface bound to a fixed 100×100 anchor on a quiet stage. */
const renderFloating = (
  props: Omit<FloatingContainerProps, 'children' | 'class'> = {},
) => {
  const { container } = render(() => (
    <div class={fixture.stage}>
      <div class={`${anchor} ${fixture.anchorBox}`} data-testid="anchor">
        <FloatingContainer class={fixture.surface} {...props}>
          content
        </FloatingContainer>
      </div>
    </div>
  ));

  const anchorRect = container
    .querySelector('[data-testid="anchor"]')!
    .getBoundingClientRect();
  const floatingRect = container
    .querySelector('[data-side]')!
    .getBoundingClientRect();

  return { anchorRect, floatingRect };
};

describe('FloatingContainer geometry', () => {
  it('rests fully outside the bound edge', () => {
    const bottom = renderFloating({ side: 'bottom' });
    expect(bottom.floatingRect.top).toBeCloseTo(bottom.anchorRect.bottom);

    const top = renderFloating({ side: 'top' });
    expect(top.floatingRect.bottom).toBeCloseTo(top.anchorRect.top);

    const left = renderFloating({ side: 'left' });
    expect(left.floatingRect.right).toBeCloseTo(left.anchorRect.left);

    const right = renderFloating({ side: 'right' });
    expect(right.floatingRect.left).toBeCloseTo(right.anchorRect.right);
  });

  it('aligns along the bound edge', () => {
    const start = renderFloating({ side: 'bottom', align: 'start' });
    expect(start.floatingRect.left).toBeCloseTo(start.anchorRect.left);

    const center = renderFloating({ side: 'bottom', align: 'center' });
    expect(
      center.floatingRect.left + center.floatingRect.width / 2,
    ).toBeCloseTo(center.anchorRect.left + center.anchorRect.width / 2);

    const end = renderFloating({ side: 'bottom', align: 'end' });
    expect(end.floatingRect.right).toBeCloseTo(end.anchorRect.right);

    const vertical = renderFloating({ side: 'right', align: 'end' });
    expect(vertical.floatingRect.bottom).toBeCloseTo(
      vertical.anchorRect.bottom,
    );
  });

  it('opens a gap off the edge with sideOffset', () => {
    const bottom = renderFloating({ side: 'bottom', sideOffset: 10 });
    expect(bottom.floatingRect.top).toBeCloseTo(bottom.anchorRect.bottom + 10);

    const top = renderFloating({ side: 'top', sideOffset: 10 });
    expect(top.floatingRect.bottom).toBeCloseTo(top.anchorRect.top - 10);

    const left = renderFloating({ side: 'left', sideOffset: 10 });
    expect(left.floatingRect.right).toBeCloseTo(left.anchorRect.left - 10);
  });

  it('nudges along the edge with alignOffset, inverting for end', () => {
    const start = renderFloating({
      side: 'bottom',
      align: 'start',
      alignOffset: 6,
    });
    expect(start.floatingRect.left).toBeCloseTo(start.anchorRect.left + 6);

    const center = renderFloating({
      side: 'bottom',
      align: 'center',
      alignOffset: 6,
    });
    expect(
      center.floatingRect.left + center.floatingRect.width / 2,
    ).toBeCloseTo(center.anchorRect.left + center.anchorRect.width / 2 + 6);

    // Positive offsets push an end-aligned surface back toward start.
    const end = renderFloating({
      side: 'bottom',
      align: 'end',
      alignOffset: 6,
    });
    expect(end.floatingRect.right).toBeCloseTo(end.anchorRect.right - 6);

    const vertical = renderFloating({
      side: 'right',
      align: 'start',
      alignOffset: 6,
    });
    expect(vertical.floatingRect.top).toBeCloseTo(vertical.anchorRect.top + 6);
  });

  it('binds to an anchor-relative point instead of an edge', () => {
    const point = { x: 30, y: 70 };

    // Growing down-right: the surface's top-left corner sits on the point.
    const downRight = renderFloating({
      point,
      side: 'bottom',
      align: 'start',
    });
    expect(downRight.floatingRect.left).toBeCloseTo(
      downRight.anchorRect.left + 30,
    );
    expect(downRight.floatingRect.top).toBeCloseTo(
      downRight.anchorRect.top + 70,
    );

    // Growing up: the surface's bottom edge sits on the point.
    const up = renderFloating({ point, side: 'top', align: 'start' });
    expect(up.floatingRect.bottom).toBeCloseTo(up.anchorRect.top + 70);

    // End alignment: the far edge sits on the point.
    const end = renderFloating({ point, side: 'bottom', align: 'end' });
    expect(end.floatingRect.right).toBeCloseTo(end.anchorRect.left + 30);

    // Centered growth splits the surface across the point.
    const centered = renderFloating({ point, side: 'bottom', align: 'center' });
    expect(
      centered.floatingRect.left + centered.floatingRect.width / 2,
    ).toBeCloseTo(centered.anchorRect.left + 30);

    // Sideways growth: the surface's left edge sits on the point.
    const rightward = renderFloating({ point, side: 'right', align: 'start' });
    expect(rightward.floatingRect.left).toBeCloseTo(
      rightward.anchorRect.left + 30,
    );
    expect(rightward.floatingRect.top).toBeCloseTo(
      rightward.anchorRect.top + 70,
    );
  });

  it('flips to the roomier side when tethered against a viewport edge', async () => {
    // Anchor flush with the viewport's bottom edge: a below-surface
    // has no room, so the tether flips it above.
    const { container } = render(() => (
      <Tethered stage={fixture.pinBottom} side="bottom" tether={flipTether} />
    ));
    const floating = container.querySelector('[data-side]')!;

    await waitFor(() => expect(floating).toHaveAttribute('data-side', 'top'));

    const anchorRect = container
      .querySelector('[data-testid="anchor"]')!
      .getBoundingClientRect();
    expect(floating.getBoundingClientRect().bottom).toBeCloseTo(anchorRect.top);
  });

  it('walks the fallback chain in order', async () => {
    // `position-try-fallbacks` semantics: the chain replaces the
    // opposite-side default, so an anchor with no room below lands on
    // the first listed placement that fits rather than flipping up.
    const { floating } = await renderTethered({
      stage: fixture.pinBottom,
      side: 'bottom',
      tether: {
        ...flipTether,
        fallbacks: [{ side: 'right' }, { side: 'top' }],
      },
    });

    await waitFor(() => expect(floating).toHaveAttribute('data-side', 'right'));
  });

  it('pins the placement when the fallback chain is empty', async () => {
    // No fallbacks to try means nowhere to go: the surface overflows
    // rather than moving, exactly as an empty `position-try` list would.
    const { floating } = await renderTethered({
      stage: fixture.pinBottom,
      side: 'bottom',
      tether: { ...flipTether, fallbacks: [] },
    });

    expect(floating).toHaveAttribute('data-side', 'bottom');
  });

  it('re-resolves placement across a scroll round-trip', async () => {
    // Scroll the anchor to the viewport's bottom edge (the surface
    // flips above), then back to the middle where both sides fit: with
    // no memory, the surface snaps home to the requested side.
    const { container } = render(() => (
      <div class={fixture.scrollStage} data-testid="scroller">
        <div class={fixture.runway}>
          <Tethered stage="" side="bottom" tether={flipTether} />
        </div>
      </div>
    ));
    const scroller = container.querySelector<HTMLElement>(
      '[data-testid="scroller"]',
    )!;
    const anchorBox = container.querySelector('[data-testid="anchor"]')!;
    const floating = container.querySelector('[data-side]')!;
    const viewportHeight = document.documentElement.clientHeight;

    // Center the anchor: both sides fit, the requested side stands.
    const centerAnchor = () => {
      const rect = anchorBox.getBoundingClientRect();
      scroller.scrollTop += rect.top + rect.height / 2 - viewportHeight / 2;
    };

    centerAnchor();
    await waitFor(() =>
      expect(floating).toHaveAttribute('data-side', 'bottom'),
    );

    // Carry the anchor down to the bottom edge (scrolling up moves
    // content down): 10px of room left below, the surface flips above.
    scroller.scrollTop -=
      viewportHeight - anchorBox.getBoundingClientRect().bottom - 10;
    await waitFor(() => expect(floating).toHaveAttribute('data-side', 'top'));

    // Back to the middle: both sides fit again, so it snaps home.
    centerAnchor();
    await waitFor(() =>
      expect(floating).toHaveAttribute('data-side', 'bottom'),
    );
  });

  it('applies offsets from the point in point mode', () => {
    const point = { x: 30, y: 70 };

    const gapped = renderFloating({
      point,
      side: 'bottom',
      align: 'start',
      sideOffset: 10,
      alignOffset: 6,
    });
    expect(gapped.floatingRect.top).toBeCloseTo(
      gapped.anchorRect.top + 70 + 10,
    );
    expect(gapped.floatingRect.left).toBeCloseTo(
      gapped.anchorRect.left + 30 + 6,
    );

    // Growing up, the gap opens above the point.
    const upward = renderFloating({
      point,
      side: 'top',
      align: 'start',
      sideOffset: 10,
    });
    expect(upward.floatingRect.bottom).toBeCloseTo(
      upward.anchorRect.top + 70 - 10,
    );
  });

  it('reproduces the CSS placement when nothing collides', async () => {
    // The tether takes positioning over outright rather than nudging
    // it, so an uncontested placement has to land in the same spot the
    // pure-CSS rules would have put it.
    const { floating, anchorBox } = await renderTethered({
      stage: fixture.stage,
      side: 'bottom',
      sideOffset: 10,
      tether: {},
    });

    const anchorRect = anchorBox.getBoundingClientRect();
    const floatingRect = floating.getBoundingClientRect();

    expectNear(floatingRect.top, anchorRect.bottom + 10);
    expectNear(
      floatingRect.left + floatingRect.width / 2,
      anchorRect.left + anchorRect.width / 2,
    );
  });

  it('slides the surface back inside the padded viewport', async () => {
    // A 300px surface centered on a 100px anchor flush against the left
    // edge would start at -100. Sliding along the edge is the only way
    // to keep it visible — flipping sides wouldn't help.
    const { floating, anchorBox } = await renderTethered({
      stage: fixture.pinLeft,
      surface: fixture.wideSurface,
      side: 'bottom',
      tether: { padding: 8 },
    });

    expect(anchorBox.getBoundingClientRect().left).toBeCloseTo(0);
    expectNear(floating.getBoundingClientRect().left, 8);
  });

  it('keeps the arrow over the anchor after sliding', async () => {
    const { anchorBox, arrow } = await renderTethered({
      stage: fixture.pinLeft,
      surface: fixture.wideSurface,
      side: 'bottom',
      arrow: { visible: true },
      tether: { padding: 8 },
    });

    const anchorRect = anchorBox.getBoundingClientRect();
    const arrowRect = arrow!.getBoundingClientRect();

    expectNear(
      arrowRect.left + arrowRect.width / 2,
      anchorRect.left + anchorRect.width / 2,
    );
  });

  it('publishes the anchor box and the room left for the surface', async () => {
    const { floating } = await renderTethered({
      stage: fixture.stage,
      side: 'bottom',
      tether: {},
    });

    // Size matching reads these; without JavaScript they stay unset and
    // the surface falls back to hugging its content.
    expect(floating.style.getPropertyValue(varName(css.anchorWidth))).toBe(
      '100px',
    );
    expect(floating.style.getPropertyValue(varName(css.anchorHeight))).toBe(
      '100px',
    );
    expect(
      floating.style.getPropertyValue(varName(css.availableHeight)),
    ).toMatch(/^\d+(\.\d+)?px$/);
  });

  it('flags the surface once the anchor is clipped out of view', async () => {
    const { container } = render(() => (
      <div class={fixture.clipStage} data-testid="port">
        <div class={fixture.clipRunway}>
          <Tethered
            stage=""
            side="bottom"
            tether={{ hideWhenDetached: true }}
          />
        </div>
      </div>
    ));
    const port = container.querySelector<HTMLElement>('[data-testid="port"]')!;
    const floating = container.querySelector<HTMLElement>('[data-side]')!;

    await waitFor(() => expect(floating).toHaveAttribute('data-tethered'));
    expect(floating).not.toHaveAttribute('data-anchor-hidden');

    // Scroll the anchor clean past the top of its scroll port.
    port.scrollTop = port.scrollHeight;
    await waitFor(() => expect(floating).toHaveAttribute('data-anchor-hidden'));
    expect(getComputedStyle(floating).visibility).toBe('hidden');

    // And back: detachment is a state, not a teardown.
    port.scrollTop = 0;
    await waitFor(() =>
      expect(floating).not.toHaveAttribute('data-anchor-hidden'),
    );
  });

  it('resolves collisions in point mode too', async () => {
    // The point becomes a zero-size anchor, so every placement decision
    // works exactly as it does off an edge.
    const { floating } = await renderTethered({
      stage: fixture.pinBottom,
      point: { x: 50, y: 100 },
      side: 'bottom',
      tether: { size: false },
    });

    await waitFor(() => expect(floating).toHaveAttribute('data-side', 'top'));
  });
});
