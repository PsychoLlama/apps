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
  tetherPlugins,
  type FloatingContainerProps,
  type TetherOptions,
} from '../floating-ui';
import * as fixture from './floating-ui.test.browser.css';

const { positionTry, shift, size, transformOrigin } = tetherPlugins;
const arrowPlugin = tetherPlugins.arrow;

/** The full pipeline, in fold order, with the opposite-side fallback. */
const fullPipeline = (side: 'top' | 'bottom'): TetherOptions => ({
  plugins: [
    positionTry([{ side: side === 'bottom' ? 'top' : 'bottom' }]),
    shift,
    size,
    arrowPlugin,
    transformOrigin,
  ],
});

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
  const shellRect = container
    .querySelector('[data-side]')!
    .getBoundingClientRect();

  return { anchorRect, shellRect };
};

describe('FloatingContainer geometry', () => {
  it('rests fully outside the bound edge', () => {
    const bottom = renderFloating({ side: 'bottom' });
    expect(bottom.shellRect.top).toBeCloseTo(bottom.anchorRect.bottom);

    const top = renderFloating({ side: 'top' });
    expect(top.shellRect.bottom).toBeCloseTo(top.anchorRect.top);

    const left = renderFloating({ side: 'left' });
    expect(left.shellRect.right).toBeCloseTo(left.anchorRect.left);

    const right = renderFloating({ side: 'right' });
    expect(right.shellRect.left).toBeCloseTo(right.anchorRect.right);
  });

  it('aligns along the bound edge', () => {
    const start = renderFloating({ side: 'bottom', align: 'start' });
    expect(start.shellRect.left).toBeCloseTo(start.anchorRect.left);

    const center = renderFloating({ side: 'bottom', align: 'center' });
    expect(center.shellRect.left + center.shellRect.width / 2).toBeCloseTo(
      center.anchorRect.left + center.anchorRect.width / 2,
    );

    const end = renderFloating({ side: 'bottom', align: 'end' });
    expect(end.shellRect.right).toBeCloseTo(end.anchorRect.right);

    const vertical = renderFloating({ side: 'right', align: 'end' });
    expect(vertical.shellRect.bottom).toBeCloseTo(vertical.anchorRect.bottom);
  });

  it('opens a gap off the edge with sideOffset', () => {
    const bottom = renderFloating({ side: 'bottom', sideOffset: 10 });
    expect(bottom.shellRect.top).toBeCloseTo(bottom.anchorRect.bottom + 10);

    const top = renderFloating({ side: 'top', sideOffset: 10 });
    expect(top.shellRect.bottom).toBeCloseTo(top.anchorRect.top - 10);

    const left = renderFloating({ side: 'left', sideOffset: 10 });
    expect(left.shellRect.right).toBeCloseTo(left.anchorRect.left - 10);
  });

  it('nudges along the edge with alignOffset, inverting for end', () => {
    const start = renderFloating({
      side: 'bottom',
      align: 'start',
      alignOffset: 6,
    });
    expect(start.shellRect.left).toBeCloseTo(start.anchorRect.left + 6);

    const center = renderFloating({
      side: 'bottom',
      align: 'center',
      alignOffset: 6,
    });
    expect(center.shellRect.left + center.shellRect.width / 2).toBeCloseTo(
      center.anchorRect.left + center.anchorRect.width / 2 + 6,
    );

    // Positive offsets push an end-aligned surface back toward start.
    const end = renderFloating({
      side: 'bottom',
      align: 'end',
      alignOffset: 6,
    });
    expect(end.shellRect.right).toBeCloseTo(end.anchorRect.right - 6);

    const vertical = renderFloating({
      side: 'right',
      align: 'start',
      alignOffset: 6,
    });
    expect(vertical.shellRect.top).toBeCloseTo(vertical.anchorRect.top + 6);
  });

  it('binds to an anchor-relative point instead of an edge', () => {
    const point = { x: 30, y: 70 };

    // Growing down-right: the surface's top-left corner sits on the point.
    const downRight = renderFloating({
      point,
      side: 'bottom',
      align: 'start',
    });
    expect(downRight.shellRect.left).toBeCloseTo(
      downRight.anchorRect.left + 30,
    );
    expect(downRight.shellRect.top).toBeCloseTo(downRight.anchorRect.top + 70);

    // Growing up: the surface's bottom edge sits on the point.
    const up = renderFloating({ point, side: 'top', align: 'start' });
    expect(up.shellRect.bottom).toBeCloseTo(up.anchorRect.top + 70);

    // End alignment: the far edge sits on the point.
    const end = renderFloating({ point, side: 'bottom', align: 'end' });
    expect(end.shellRect.right).toBeCloseTo(end.anchorRect.left + 30);

    // Centered growth splits the surface across the point.
    const centered = renderFloating({ point, side: 'bottom', align: 'center' });
    expect(centered.shellRect.left + centered.shellRect.width / 2).toBeCloseTo(
      centered.anchorRect.left + 30,
    );

    // Sideways growth: the surface's left edge sits on the point.
    const rightward = renderFloating({ point, side: 'right', align: 'start' });
    expect(rightward.shellRect.left).toBeCloseTo(
      rightward.anchorRect.left + 30,
    );
    expect(rightward.shellRect.top).toBeCloseTo(rightward.anchorRect.top + 70);
  });

  it('flips to the roomier side when tethered against a viewport edge', async () => {
    // Anchor flush with the viewport's bottom edge: a below-surface
    // has no room, so the tether flips it above.
    const { container } = render(() => (
      <Tethered
        stage={fixture.pinBottom}
        side="bottom"
        tether={fullPipeline('bottom')}
      />
    ));
    const shell = container.querySelector('[data-side]')!;

    await waitFor(() => expect(shell).toHaveAttribute('data-side', 'top'));

    const anchorRect = container
      .querySelector('[data-testid="anchor"]')!
      .getBoundingClientRect();
    expect(shell.getBoundingClientRect().bottom).toBeCloseTo(anchorRect.top);
  });

  it('slides a tethered surface back into the viewport', async () => {
    // Anchor flush with the left edge: a centered 300px surface starts
    // 100px offscreen, and the shift plugin walks it back in.
    const { container } = render(() => (
      <Tethered
        stage={fixture.pinLeft}
        surface={fixture.wideSurface}
        side="bottom"
        tether={{ plugins: [shift] }}
      />
    ));
    const shell = container.querySelector('[data-side]')!;

    await waitFor(() =>
      expect(shell.getBoundingClientRect().left).toBeCloseTo(0),
    );
    // The side never needed to change.
    expect(shell).toHaveAttribute('data-side', 'bottom');
  });

  it('centers the arrow over the anchor and aims the transform origin', async () => {
    const { container } = render(() => (
      <Tethered
        stage={fixture.pinLeft}
        surface={fixture.wideSurface}
        side="bottom"
        tether={fullPipeline('bottom')}
        arrow={{ visible: true }}
      />
    ));
    const shell = container.querySelector<HTMLElement>('[data-side]')!;
    const arrowElement = container.querySelector('svg')!;
    const anchorRect = container
      .querySelector('[data-testid="anchor"]')!
      .getBoundingClientRect();
    const anchorCenter = anchorRect.left + anchorRect.width / 2;

    // The shifted surface leaves the resting arrow off-center; the
    // arrow plugin walks it back over the anchor.
    await waitFor(() => {
      const arrowRect = arrowElement.getBoundingClientRect();
      expect(arrowRect.left + arrowRect.width / 2).toBeCloseTo(anchorCenter);
    });

    // Scale animations grow out of the point facing the anchor.
    const [originX, originY] = getComputedStyle(shell)
      .transformOrigin.split(' ')
      .map(parseFloat);
    expect(originX + shell.getBoundingClientRect().left).toBeCloseTo(
      anchorCenter,
    );
    expect(originY).toBeCloseTo(0);
  });

  it('re-centers the arrow after a flip through the follow-up pass', async () => {
    // Start-aligned against the bottom edge: the tether flips the
    // surface above, invalidating the arrow's measured seat; the
    // second pass re-centers it over the anchor.
    const { container } = render(() => (
      <Tethered
        stage={fixture.pinBottom}
        surface={fixture.wideSurface}
        side="bottom"
        align="start"
        tether={fullPipeline('bottom')}
        arrow={{ visible: true }}
      />
    ));
    const shell = container.querySelector('[data-side]')!;
    const arrowElement = container.querySelector('svg')!;
    const anchorRect = container
      .querySelector('[data-testid="anchor"]')!
      .getBoundingClientRect();
    const anchorCenter = anchorRect.left + anchorRect.width / 2;

    await waitFor(() => {
      expect(shell).toHaveAttribute('data-side', 'top');
      const arrowRect = arrowElement.getBoundingClientRect();
      expect(arrowRect.left + arrowRect.width / 2).toBeCloseTo(anchorCenter);
    });
  });

  it('publishes available-space vars when tethered', async () => {
    const { container } = render(() => (
      <Tethered
        stage={fixture.pinLeft}
        side="bottom"
        tether={{ plugins: [size] }}
      />
    ));
    const shell = container.querySelector<HTMLElement>('[data-side]')!;
    const anchorRect = container
      .querySelector('[data-testid="anchor"]')!
      .getBoundingClientRect();

    await waitFor(() => {
      // Inline vars are hashed names; match by known values instead:
      // the anchor is 100px wide, and the space below it runs to the
      // viewport's bottom edge.
      const style = shell.getAttribute('style')!;
      expect(style).toContain(': 100px');
      expect(style).toContain(
        `: ${document.documentElement.clientHeight - anchorRect.bottom}px`,
      );
    });
  });

  it('holds a fallback placement across a scroll round-trip', async () => {
    // Scroll the anchor to the viewport's bottom edge (the surface
    // flips above), then back to the middle where both sides fit: the
    // position-try memory keeps it above instead of snapping home.
    const { container } = render(() => (
      <div class={fixture.scrollStage} data-testid="scroller">
        <div class={fixture.runway}>
          <Tethered stage="" side="bottom" tether={fullPipeline('bottom')} />
        </div>
      </div>
    ));
    const scroller = container.querySelector<HTMLElement>(
      '[data-testid="scroller"]',
    )!;
    const anchorBox = container.querySelector('[data-testid="anchor"]')!;
    const shell = container.querySelector('[data-side]')!;
    const viewportHeight = document.documentElement.clientHeight;

    // Center the anchor: both sides fit, the requested side stands.
    const centerAnchor = () => {
      const rect = anchorBox.getBoundingClientRect();
      scroller.scrollTop += rect.top + rect.height / 2 - viewportHeight / 2;
    };

    centerAnchor();
    await waitFor(() => expect(shell).toHaveAttribute('data-side', 'bottom'));

    // Carry the anchor down to the bottom edge (scrolling up moves
    // content down): 10px of room left below, the surface flips above.
    scroller.scrollTop -=
      viewportHeight - anchorBox.getBoundingClientRect().bottom - 10;
    await waitFor(() => expect(shell).toHaveAttribute('data-side', 'top'));

    // Back to the middle: the painted side still fits, so it holds.
    centerAnchor();
    await waitFor(() =>
      expect(anchorBox.getBoundingClientRect().top).toBeGreaterThan(100),
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(shell).toHaveAttribute('data-side', 'top');
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
    expect(gapped.shellRect.top).toBeCloseTo(gapped.anchorRect.top + 70 + 10);
    expect(gapped.shellRect.left).toBeCloseTo(gapped.anchorRect.left + 30 + 6);

    // Growing up, the gap opens above the point.
    const upward = renderFloating({
      point,
      side: 'top',
      align: 'start',
      sideOffset: 10,
    });
    expect(upward.shellRect.bottom).toBeCloseTo(
      upward.anchorRect.top + 70 - 10,
    );
  });
});
