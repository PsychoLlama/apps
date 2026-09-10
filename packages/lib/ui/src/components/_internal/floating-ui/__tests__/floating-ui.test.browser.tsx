/**
 * Geometry tests for the floating-ui primitive.
 *
 * Placement is CSS keyed off `data-side`/`data-align` and inline offset
 * vars, or measured coordinates once a tether lands, so the real browser
 * is the only place the resulting pixel positions can be asserted —
 * JSDOM doesn't run layout.
 *
 * Every edge-mode case runs in both modes. The point of the tether is
 * that, given room, it paints the same pixels the CSS does; these tests
 * are that claim.
 */

import { type Middleware } from '@floating-ui/dom';
import { render, waitFor, within } from '@solidjs/testing-library';
import {
  FloatingRoot,
  FloatingWindow,
  type FloatingTether,
  type FloatingWindowProps,
} from '..';
import * as fixture from './floating-ui.test.browser.css';

type Mode = 'css' | 'tether';

const TETHER_BY_MODE: Record<Mode, FloatingTether | undefined> = {
  css: undefined,
  tether: { middleware: [] },
};

/** Both placement modes, for `it.each` over the cases they must agree on. */
const MODES: Mode[] = ['css', 'tether'];

/** Wait for the first measurement to land on a tethered window. */
const settled = async (window: Element) => {
  await waitFor(() => {
    expect(window.hasAttribute('data-tethered')).toBe(true);
  });
};

/**
 * Render a window bound to a fixed 100×100 anchor on a quiet stage, in
 * the given mode, and measure both once placement has settled.
 */
const renderFloating = async (
  mode: Mode,
  props: Omit<FloatingWindowProps, 'children' | 'class' | 'tether'> = {},
) => {
  const { container } = render(() => (
    <div class={fixture.stage}>
      <FloatingRoot display="block" class={fixture.anchorBox} testId="anchor">
        <FloatingWindow
          class={fixture.surface}
          testId="surface"
          tether={TETHER_BY_MODE[mode]}
          {...props}
        >
          content
        </FloatingWindow>
      </FloatingRoot>
    </div>
  ));

  // The positioned box carries no test id — `testId` lands on the body —
  // so its placement attribute is the handle.
  const window = container.querySelector('[data-side]')!;
  if (mode === 'tether') await settled(window);

  const anchorRect = within(container)
    .getByTestId('anchor')
    .getBoundingClientRect();
  const floatingRect = window.getBoundingClientRect();
  const arrowRect = within(container)
    .queryByTestId('surface-arrow')
    ?.getBoundingClientRect();

  return { container, window, anchorRect, floatingRect, arrowRect };
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

    const anchorRect = within(container)
      .getByTestId('anchor')
      .getBoundingClientRect();
    const floatingRect = container
      .querySelector('[data-side]')!
      .getBoundingClientRect();

    // The anchored element's border stays inside the box the root names.
    expect(anchorRect.width).toBeCloseTo(100);
    expect(floatingRect.top).toBeCloseTo(anchorRect.bottom);
    expect(floatingRect.left).toBeCloseTo(anchorRect.left);
  });

  describe.each(MODES)('in %s mode', (mode) => {
    it('rests fully outside the bound edge', async () => {
      const bottom = await renderFloating(mode, { side: 'bottom' });
      expect(bottom.floatingRect.top).toBeCloseTo(bottom.anchorRect.bottom);

      const top = await renderFloating(mode, { side: 'top' });
      expect(top.floatingRect.bottom).toBeCloseTo(top.anchorRect.top);

      const left = await renderFloating(mode, { side: 'left' });
      expect(left.floatingRect.right).toBeCloseTo(left.anchorRect.left);

      const right = await renderFloating(mode, { side: 'right' });
      expect(right.floatingRect.left).toBeCloseTo(right.anchorRect.right);
    });

    it('aligns along the bound edge', async () => {
      const start = await renderFloating(mode, {
        side: 'bottom',
        align: 'start',
      });
      expect(start.floatingRect.left).toBeCloseTo(start.anchorRect.left);

      const center = await renderFloating(mode, {
        side: 'bottom',
        align: 'center',
      });
      expect(
        center.floatingRect.left + center.floatingRect.width / 2,
      ).toBeCloseTo(center.anchorRect.left + center.anchorRect.width / 2);

      const end = await renderFloating(mode, { side: 'bottom', align: 'end' });
      expect(end.floatingRect.right).toBeCloseTo(end.anchorRect.right);

      const vertical = await renderFloating(mode, {
        side: 'right',
        align: 'end',
      });
      expect(vertical.floatingRect.bottom).toBeCloseTo(
        vertical.anchorRect.bottom,
      );
    });

    it('opens a gap off the edge with sideOffset', async () => {
      const bottom = await renderFloating(mode, {
        side: 'bottom',
        sideOffset: 10,
      });
      expect(bottom.floatingRect.top).toBeCloseTo(
        bottom.anchorRect.bottom + 10,
      );

      const top = await renderFloating(mode, { side: 'top', sideOffset: 10 });
      expect(top.floatingRect.bottom).toBeCloseTo(top.anchorRect.top - 10);

      const left = await renderFloating(mode, {
        side: 'left',
        sideOffset: 10,
      });
      expect(left.floatingRect.right).toBeCloseTo(left.anchorRect.left - 10);
    });

    it('nudges along the edge with alignOffset, inverting for end', async () => {
      const start = await renderFloating(mode, {
        side: 'bottom',
        align: 'start',
        alignOffset: 6,
      });
      expect(start.floatingRect.left).toBeCloseTo(start.anchorRect.left + 6);

      // Positive offsets push an end-aligned surface back toward start.
      const end = await renderFloating(mode, {
        side: 'bottom',
        align: 'end',
        alignOffset: 6,
      });
      expect(end.floatingRect.right).toBeCloseTo(end.anchorRect.right - 6);

      const vertical = await renderFloating(mode, {
        side: 'right',
        align: 'start',
        alignOffset: 6,
      });
      expect(vertical.floatingRect.top).toBeCloseTo(
        vertical.anchorRect.top + 6,
      );
    });

    it('ignores alignOffset when centered', async () => {
      // floating-ui's `offset` applies the alignment axis only to
      // start/end placements; the CSS follows suit so the two agree.
      const center = await renderFloating(mode, {
        side: 'bottom',
        align: 'center',
        alignOffset: 6,
      });
      expect(
        center.floatingRect.left + center.floatingRect.width / 2,
      ).toBeCloseTo(center.anchorRect.left + center.anchorRect.width / 2);
    });
  });

  // Point mode is CSS-only until the tether learns to bind to a point.
  it('binds to an anchor-relative point instead of an edge', async () => {
    const point = { x: 30, y: 70 };

    // Growing down-right: the surface's top-left corner sits on the point.
    const downRight = await renderFloating('css', {
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
    const up = await renderFloating('css', {
      point,
      side: 'top',
      align: 'start',
    });
    expect(up.floatingRect.bottom).toBeCloseTo(up.anchorRect.top + 70);

    // End alignment: the far edge sits on the point.
    const end = await renderFloating('css', {
      point,
      side: 'bottom',
      align: 'end',
    });
    expect(end.floatingRect.right).toBeCloseTo(end.anchorRect.left + 30);

    // Centered growth splits the surface across the point.
    const centered = await renderFloating('css', {
      point,
      side: 'bottom',
      align: 'center',
    });
    expect(
      centered.floatingRect.left + centered.floatingRect.width / 2,
    ).toBeCloseTo(centered.anchorRect.left + 30);

    // Sideways growth: the surface's left edge sits on the point.
    const rightward = await renderFloating('css', {
      point,
      side: 'right',
      align: 'start',
    });
    expect(rightward.floatingRect.left).toBeCloseTo(
      rightward.anchorRect.left + 30,
    );
    expect(rightward.floatingRect.top).toBeCloseTo(
      rightward.anchorRect.top + 70,
    );
  });

  it('applies offsets from the point in point mode', async () => {
    const point = { x: 30, y: 70 };

    const gapped = await renderFloating('css', {
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
    const upward = await renderFloating('css', {
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

describe('FloatingWindow tether', () => {
  it('re-resolves the placement when middleware says so', async () => {
    // A middleware that always asks for the opposite side. Whether the
    // page needed the flip is floating-ui's business; that the window
    // honors the answer is ours.
    const flipToTop: Middleware = {
      name: 'test-flip',
      fn: ({ placement }) =>
        placement === 'top' ? {} : { reset: { placement: 'top' } },
    };

    const { container } = render(() => (
      <div class={fixture.stage}>
        <FloatingRoot display="block" class={fixture.anchorBox} testId="anchor">
          <FloatingWindow
            class={fixture.surface}
            side="bottom"
            tether={{ middleware: [flipToTop] }}
          >
            content
          </FloatingWindow>
        </FloatingRoot>
      </div>
    ));

    const window = container.querySelector('[data-side]')!;
    await settled(window);

    const anchorRect = within(container)
      .getByTestId('anchor')
      .getBoundingClientRect();
    const floatingRect = window.getBoundingClientRect();

    expect(window.getAttribute('data-side')).toBe('top');
    expect(floatingRect.bottom).toBeCloseTo(anchorRect.top);
  });

  it('seats the arrow on the anchor', async () => {
    // Start-aligned, the surface (80 wide) is narrower than the anchor
    // (100), so the anchor's center sits inside the surface and the
    // arrow can point straight at it.
    const { arrowRect, anchorRect } = await renderFloating('tether', {
      side: 'bottom',
      align: 'start',
      arrow: {},
    });

    expect(arrowRect).toBeDefined();
    expect(arrowRect!.left + arrowRect!.width / 2).toBeCloseTo(
      anchorRect.left + anchorRect.width / 2,
    );
    // The tip is the arrow's top edge, resting on the anchor's bottom.
    expect(arrowRect!.top).toBeCloseTo(anchorRect.bottom);
  });
});
