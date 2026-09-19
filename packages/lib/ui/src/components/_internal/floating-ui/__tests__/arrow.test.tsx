/**
 * Wiring tests for the floating-ui pointer arrow.
 *
 * Covers what the arrow promises: it draws a correctly-sized triangle for
 * each direction — without a rotation transform, so the SVG box matches
 * the shape — seats itself along the edge, and merges a consumer class.
 * The box's rendered size comes from the window's stylesheet, so it's
 * covered in the window's browser tests instead.
 */

import { render } from '@solidjs/testing-library';
import { Arrow } from '../arrow';

describe('Arrow', () => {
  it('draws each direction and swaps its box when horizontal', () => {
    // Base 12, depth 6. Vertical arrows measure 12×6; horizontal ones
    // stand the base on its end and measure 6×12 — no transform.
    const cases = [
      { direction: 'up', width: 12, height: 6, points: '0,6 12,6 6,0' },
      { direction: 'down', width: 12, height: 6, points: '0,0 12,0 6,6' },
      { direction: 'left', width: 6, height: 12, points: '6,0 6,12 0,6' },
      { direction: 'right', width: 6, height: 12, points: '0,0 0,12 6,6' },
    ] as const;

    for (const { direction, width, height, points } of cases) {
      const { container } = render(() => (
        <Arrow base={12} depth={6} direction={direction} />
      ));
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('viewBox', `0 0 ${width} ${height}`);
      expect(svg?.querySelector('polygon')).toHaveAttribute('points', points);
      expect(svg?.style.transform).toBe('');
    }
  });

  it('reflects its alignment into the data attribute', () => {
    const { container } = render(() => (
      <Arrow base={12} depth={6} direction="left" align="start" />
    ));

    expect(container.querySelector('svg')).toHaveAttribute(
      'data-align',
      'start',
    );
  });

  it('defaults its alignment to center', () => {
    const { container } = render(() => (
      <Arrow base={12} depth={6} direction="up" />
    ));

    expect(container.querySelector('svg')).toHaveAttribute(
      'data-align',
      'center',
    );
  });

  it('reflects its direction into the data attribute the offset keys off', () => {
    const { container } = render(() => (
      <Arrow base={12} depth={6} direction="right" />
    ));

    expect(container.querySelector('svg')).toHaveAttribute(
      'data-direction',
      'right',
    );
  });

  it('merges a consumer class', () => {
    const { container } = render(() => (
      <Arrow base={12} depth={6} direction="up" class="fill" />
    ));

    expect(container.querySelector('svg')).toHaveClass('fill');
  });
});
