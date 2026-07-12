/**
 * Math tests for the tether's pure core. Every plugin is a pure
 * function over plain rects, so the whole decision pipeline is
 * exercised here without layout; only the observe/apply glue needs the
 * browser suite.
 */

import { availableOnSide, place, type TetherRect } from '../geometry';
import { initialDecisions, runTether, type TetherState } from '../pipeline';
import { arrow } from '../plugins/arrow';
import { flip } from '../plugins/flip';
import { shift } from '../plugins/shift';
import { size } from '../plugins/size';
import { transformOrigin } from '../plugins/transform-origin';

const rect = (
  left: number,
  top: number,
  width: number,
  height: number,
): TetherRect => ({ x: left, y: top, width, height });

/** A 100×100 anchor centered in a 1000×1000 viewport, 200×100 popup. */
const state = (overrides: Partial<TetherState> = {}): TetherState => ({
  placement: { side: 'bottom', align: 'center', sideOffset: 0, alignOffset: 0 },
  anchor: rect(450, 450, 100, 100),
  popup: rect(400, 550, 200, 100),
  parent: rect(0, 0, 1000, 1000),
  viewport: rect(0, 0, 1000, 1000),
  arrow: null,
  padding: 0,
  applied: { side: 'bottom', align: 'center', arrowShiftX: 0, arrowShiftY: 0 },
  ...overrides,
});

describe('place', () => {
  const anchor = rect(450, 450, 100, 100);
  const popup = { width: 200, height: 100 };
  const at = (
    side: 'top' | 'right' | 'bottom' | 'left',
    align: 'start' | 'center' | 'end',
    offsets: { sideOffset?: number; alignOffset?: number } = {},
  ) =>
    place(anchor, popup, {
      side,
      align,
      sideOffset: offsets.sideOffset ?? 0,
      alignOffset: offsets.alignOffset ?? 0,
    });

  it('rests the surface fully outside the bound edge', () => {
    expect(at('bottom', 'center')).toEqual(rect(400, 550, 200, 100));
    expect(at('top', 'center')).toEqual(rect(400, 350, 200, 100));
    expect(at('left', 'center')).toEqual(rect(250, 450, 200, 100));
    expect(at('right', 'center')).toEqual(rect(550, 450, 200, 100));
  });

  it('aligns along the bound edge', () => {
    expect(at('bottom', 'start').x).toBe(450);
    expect(at('bottom', 'end').x).toBe(350);
    expect(at('right', 'start').y).toBe(450);
    expect(at('right', 'end').y).toBe(450);
  });

  it('opens a gap with sideOffset', () => {
    expect(at('bottom', 'center', { sideOffset: 10 }).y).toBe(560);
    expect(at('top', 'center', { sideOffset: 10 }).y).toBe(340);
    expect(at('left', 'center', { sideOffset: 10 }).x).toBe(240);
  });

  it('applies alignOffset with logical inversion', () => {
    expect(at('bottom', 'start', { alignOffset: 6 }).x).toBe(456);
    expect(at('bottom', 'center', { alignOffset: 6 }).x).toBe(406);
    // Positive pushes an end-aligned surface back toward start.
    expect(at('bottom', 'end', { alignOffset: 6 }).x).toBe(344);
  });
});

describe('availableOnSide', () => {
  it('measures the padded gap between anchor and viewport edge', () => {
    const anchor = rect(450, 450, 100, 100);
    const viewport = rect(0, 0, 1000, 1000);

    expect(availableOnSide(anchor, viewport, 'top', 0, 0)).toBe(450);
    expect(availableOnSide(anchor, viewport, 'bottom', 0, 0)).toBe(450);
    expect(availableOnSide(anchor, viewport, 'bottom', 10, 8)).toBe(432);
    expect(availableOnSide(anchor, viewport, 'right', 0, 0)).toBe(450);
  });
});

describe('flip', () => {
  it('keeps the side when the surface fits', () => {
    const decisions = flip(state(), initialDecisions(state().placement));
    expect(decisions.side).toBe('bottom');
  });

  it('flips to the opposite side when it overflows and has more room', () => {
    // Anchor near the bottom: a below-surface clips the viewport.
    const near = state({ anchor: rect(450, 850, 100, 100) });
    const decisions = flip(near, initialDecisions(near.placement));
    expect(decisions.side).toBe('top');
  });

  it('stays put when the opposite side is tighter', () => {
    // Overflows below, but above is even smaller.
    const cramped = state({
      anchor: rect(450, 20, 100, 100),
      popup: rect(0, 0, 200, 950),
    });
    const decisions = flip(cramped, initialDecisions(cramped.placement));
    expect(decisions.side).toBe('bottom');
  });

  it('respects edge padding when judging overflow', () => {
    // Fits exactly without padding; padding pushes it over the line.
    const snug = state({ anchor: rect(450, 800, 100, 100) });
    expect(flip(snug, initialDecisions(snug.placement)).side).toBe('bottom');

    const padded = state({ anchor: rect(450, 800, 100, 100), padding: 8 });
    expect(flip(padded, initialDecisions(padded.placement)).side).toBe('top');
  });

  it('flips horizontal sides too', () => {
    const near = state({
      placement: {
        side: 'right',
        align: 'center',
        sideOffset: 0,
        alignOffset: 0,
      },
      anchor: rect(850, 450, 100, 100),
    });
    const decisions = flip(near, initialDecisions(near.placement));
    expect(decisions.side).toBe('left');
  });
});

describe('shift', () => {
  it('does nothing when the surface fits', () => {
    const decisions = shift(state(), initialDecisions(state().placement));
    expect(decisions.shiftX).toBe(0);
    expect(decisions.shiftY).toBe(0);
  });

  it('slides the surface back into the viewport', () => {
    // Anchor near the left edge: a centered surface starts at -65.
    const near = state({ anchor: rect(10, 450, 50, 100) });
    const decisions = shift(near, initialDecisions(near.placement));
    expect(decisions.shiftX).toBe(65);
    expect(decisions.shiftY).toBe(0);
  });

  it('honors edge padding', () => {
    const near = state({ anchor: rect(10, 450, 50, 100), padding: 8 });
    const decisions = shift(near, initialDecisions(near.placement));
    expect(decisions.shiftX).toBe(73);
  });

  it('stops shifting before the surface detaches from the anchor', () => {
    // The full correction (330) would push the surface's left edge past
    // the anchor's right edge; the limiter stops at their meeting point.
    const far = state({ anchor: rect(-255, 450, 50, 100) });
    const decisions = shift(far, initialDecisions(far.placement));
    expect(decisions.shiftX).toBe(125);
  });

  it('shifts vertically for horizontal sides', () => {
    // Centered on a 50-tall anchor at y=10, the 100-tall surface
    // starts at -15; the correction slides it down to the edge.
    const near = state({
      placement: {
        side: 'right',
        align: 'center',
        sideOffset: 0,
        alignOffset: 0,
      },
      anchor: rect(450, 10, 100, 50),
    });
    const decisions = shift(near, initialDecisions(near.placement));
    expect(decisions.shiftX).toBe(0);
    expect(decisions.shiftY).toBe(15);
  });
});

describe('size', () => {
  it('publishes the available space at the resolved placement', () => {
    const decisions = size(state(), initialDecisions(state().placement));
    expect(decisions.availableHeight).toBe(450);
    expect(decisions.availableWidth).toBe(1000);
  });

  it('accounts for padding and side offsets', () => {
    const padded = state({
      placement: {
        side: 'bottom',
        align: 'center',
        sideOffset: 10,
        alignOffset: 0,
      },
      padding: 8,
    });
    const decisions = size(padded, initialDecisions(padded.placement));
    expect(decisions.availableHeight).toBe(432);
    expect(decisions.availableWidth).toBe(984);
  });

  it('swaps axes for horizontal sides and never goes negative', () => {
    const cramped = state({
      placement: {
        side: 'right',
        align: 'center',
        sideOffset: 0,
        alignOffset: 0,
      },
      anchor: rect(950, 450, 100, 100),
    });
    const decisions = size(cramped, initialDecisions(cramped.placement));
    expect(decisions.availableWidth).toBe(0);
    expect(decisions.availableHeight).toBe(1000);
  });

  it('measures the flipped side, not the requested one', () => {
    const flipped = size(state(), {
      ...initialDecisions(state().placement),
      side: 'top',
    });
    expect(flipped.availableHeight).toBe(450);
  });
});

describe('arrow', () => {
  // Arrow measured resting at the popup's center (rest center = 100
  // within the 200-wide surface at x=400).
  const withArrow = (overrides: Partial<TetherState> = {}) =>
    state({ arrow: rect(494, 550, 12, 6), ...overrides });

  it('does nothing without an arrow', () => {
    const decisions = arrow(state(), initialDecisions(state().placement));
    expect(decisions.arrowShiftX).toBe(0);
    expect(decisions.arrowHidden).toBe(false);
  });

  it('holds identity while the measured placement is stale', () => {
    const flipped = withArrow();
    const decisions = arrow(flipped, {
      ...initialDecisions(flipped.placement),
      side: 'top',
    });
    expect(decisions.arrowShiftX).toBe(0);
    expect(decisions.arrowShiftY).toBe(0);
  });

  it('leaves a centered arrow alone when it already faces the anchor', () => {
    const centered = withArrow();
    const decisions = arrow(centered, initialDecisions(centered.placement));
    expect(decisions.arrowShiftX).toBe(0);
    expect(decisions.arrowHidden).toBe(false);
  });

  it('nudges the arrow onto the anchor center', () => {
    // Start-aligned surface: placed.x = 450, anchor center = 500 sits
    // 50px in; the arrow rests at the surface center (100px in).
    const aligned = withArrow({
      placement: {
        side: 'bottom',
        align: 'start',
        sideOffset: 0,
        alignOffset: 0,
      },
      popup: rect(450, 550, 200, 100),
      arrow: rect(544, 550, 12, 6),
      applied: {
        side: 'bottom',
        align: 'start',
        arrowShiftX: 0,
        arrowShiftY: 0,
      },
    });
    const decisions = arrow(aligned, initialDecisions(aligned.placement));
    expect(decisions.arrowShiftX).toBe(-50);
    expect(decisions.arrowHidden).toBe(false);
  });

  it('normalizes its own previously applied nudge out of the measurement', () => {
    // Same layout as above, but the arrow was measured mid-nudge.
    const aligned = withArrow({
      placement: {
        side: 'bottom',
        align: 'start',
        sideOffset: 0,
        alignOffset: 0,
      },
      popup: rect(450, 550, 200, 100),
      arrow: rect(524, 550, 12, 6),
      applied: {
        side: 'bottom',
        align: 'start',
        arrowShiftX: -20,
        arrowShiftY: 0,
      },
    });
    const decisions = arrow(aligned, initialDecisions(aligned.placement));
    expect(decisions.arrowShiftX).toBe(-50);
  });

  it('clamps the arrow to the surface and hides it past the edge', () => {
    // Anchor far to the right of a detach-limited surface: its center
    // (900) lies beyond the surface's right edge (650).
    const detached = withArrow({
      anchor: rect(850, 450, 100, 100),
      popup: rect(450, 550, 200, 100),
      arrow: rect(544, 550, 12, 6),
      applied: {
        side: 'bottom',
        align: 'start',
        arrowShiftX: 0,
        arrowShiftY: 0,
      },
      placement: {
        side: 'bottom',
        align: 'start',
        sideOffset: 0,
        alignOffset: 0,
      },
    });
    // Force the placement basis the surface was measured under, with a
    // shift already decided by an earlier plugin.
    const decisions = arrow(detached, {
      ...initialDecisions(detached.placement),
      shiftX: -650, // pretend shift slid the surface far left
    });
    expect(decisions.arrowHidden).toBe(true);
  });

  it('works on the vertical axis for horizontal sides', () => {
    const sideways = withArrow({
      placement: {
        side: 'right',
        align: 'start',
        sideOffset: 0,
        alignOffset: 0,
      },
      popup: rect(550, 450, 200, 100),
      arrow: rect(550, 494, 6, 12),
      applied: {
        side: 'right',
        align: 'start',
        arrowShiftX: 0,
        arrowShiftY: 0,
      },
    });
    const decisions = arrow(sideways, initialDecisions(sideways.placement));
    // Anchor center y = 500, surface starts at 450 → target 50; the
    // arrow rests at the surface's vertical center (50). Already there.
    expect(decisions.arrowShiftY).toBe(0);
  });
});

describe('transformOrigin', () => {
  it('aims at the anchor on the facing edge', () => {
    const decisions = transformOrigin(
      state(),
      initialDecisions(state().placement),
    );
    // Anchor center x = 500, surface starts at 400 → 100px in, top edge.
    expect(decisions.transformOrigin).toBe('100px 0%');
  });

  it('flips the facing edge with the resolved side', () => {
    const decisions = transformOrigin(state(), {
      ...initialDecisions(state().placement),
      side: 'top',
    });
    expect(decisions.transformOrigin).toBe('100px 100%');
  });

  it('projects onto the vertical edge for horizontal sides', () => {
    const sideways = state({
      placement: {
        side: 'left',
        align: 'center',
        sideOffset: 0,
        alignOffset: 0,
      },
    });
    const decisions = transformOrigin(
      sideways,
      initialDecisions(sideways.placement),
    );
    expect(decisions.transformOrigin).toBe('100% 50px');
  });

  it('accounts for an earlier shift decision', () => {
    const decisions = transformOrigin(state(), {
      ...initialDecisions(state().placement),
      shiftX: 40,
    });
    expect(decisions.transformOrigin).toBe('60px 0%');
  });
});

describe('runTether', () => {
  it('reproduces the pure-CSS placement with no plugins', () => {
    const decisions = runTether(state(), []);
    expect(decisions).toEqual(initialDecisions(state().placement));
  });

  it('folds left so later plugins see earlier decisions', () => {
    const near = state({ anchor: rect(450, 850, 100, 100) });
    const decisions = runTether(near, [flip, size]);

    // size measured the flipped side's gap, not the requested one.
    expect(decisions.side).toBe('top');
    expect(decisions.availableHeight).toBe(850);
  });

  it('holds the arrow while a flip invalidates its measurement', () => {
    const near = state({
      anchor: rect(450, 850, 100, 100),
      arrow: rect(494, 550, 12, 6),
    });
    const decisions = runTether(near, [flip, shift, size, arrow]);

    expect(decisions.side).toBe('top');
    expect(decisions.arrowShiftX).toBe(0);
  });
});
