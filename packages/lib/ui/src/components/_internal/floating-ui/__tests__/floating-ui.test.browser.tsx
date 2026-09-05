/**
 * Geometry tests for the floating-ui primitive.
 *
 * Placement is pure CSS keyed off `data-side`/`data-align` and inline
 * offset vars, so the real browser is the only place the resulting
 * pixel positions can be asserted — JSDOM doesn't run layout.
 */

import { render } from '@solidjs/testing-library';
import { FloatingRoot, FloatingWindow, type FloatingWindowProps } from '..';
import * as fixture from './floating-ui.test.browser.css';

/** Render a window bound to a fixed 100×100 anchor on a quiet stage. */
const renderFloating = (
  props: Omit<FloatingWindowProps, 'children' | 'class'> = {},
) => {
  const { container } = render(() => (
    <div class={fixture.stage}>
      <FloatingRoot display="block" class={fixture.anchorBox} testId="anchor">
        <FloatingWindow class={fixture.surface} {...props}>
          content
        </FloatingWindow>
      </FloatingRoot>
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

describe('FloatingWindow geometry', () => {
  it('positions against the root, not the bordered element inside it', () => {
    // The root is what keeps the box the window resolves against and the
    // anchor's outer edge as one rectangle: it carries no border of its
    // own, so an anchored element's border stays inside both. Bind to the
    // wrong one and the window sits a border-width off.
    const { container } = render(() => (
      <div class={fixture.stage}>
        <FloatingRoot display="block" testId="anchor">
          <div class={fixture.borderedAnchorBox} />
          <FloatingWindow class={fixture.surface} side="bottom" align="start">
            content
          </FloatingWindow>
        </FloatingRoot>
      </div>
    ));

    const anchorRect = container
      .querySelector('[data-testid="anchor"]')!
      .getBoundingClientRect();
    const floatingRect = container
      .querySelector('[data-side]')!
      .getBoundingClientRect();

    // The anchored element's border stays inside the box the root names.
    expect(anchorRect.width).toBeCloseTo(100);
    expect(floatingRect.top).toBeCloseTo(anchorRect.bottom);
    expect(floatingRect.left).toBeCloseTo(anchorRect.left);
  });

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
});
