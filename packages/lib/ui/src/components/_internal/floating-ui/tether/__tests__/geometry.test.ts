/**
 * Math tests for the tether's placement geometry — the pure prediction
 * of where the CSS placement rules land a surface from sizes alone.
 */

import { availableOnSide, place } from '../geometry';
import { rect } from './fixtures';

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
