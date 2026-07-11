/**
 * Wiring tests for the floating-ui pointer arrow.
 *
 * Covers what the arrow promises: it draws a correctly-sized triangle for
 * each direction — without a rotation transform, so the SVG box matches
 * the shape — seats itself along the edge, and merges a consumer class.
 */

import { render } from '@solidjs/testing-library';
import { Arrow } from '../arrow';

describe('Arrow', () => {
  it('defaults to a 12×6 up-pointing triangle', () => {
    const { container } = render(() => <Arrow direction="up" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '12');
    expect(svg).toHaveAttribute('height', '6');
    expect(svg?.querySelector('polygon')).toHaveAttribute(
      'points',
      '0,6 12,6 6,0',
    );
  });

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

      expect(svg).toHaveAttribute('width', String(width));
      expect(svg).toHaveAttribute('height', String(height));
      expect(svg?.querySelector('polygon')).toHaveAttribute('points', points);
      expect(svg?.style.transform).toBe('');
    }
  });

  it('reflects its alignment into the data attribute', () => {
    const { container } = render(() => (
      <Arrow direction="left" align="start" />
    ));

    expect(container.querySelector('svg')).toHaveAttribute(
      'data-align',
      'start',
    );
  });

  it('defaults its alignment to center', () => {
    const { container } = render(() => <Arrow direction="up" />);

    expect(container.querySelector('svg')).toHaveAttribute(
      'data-align',
      'center',
    );
  });

  it('merges a consumer class', () => {
    const { container } = render(() => <Arrow direction="up" class="fill" />);

    expect(container.querySelector('svg')).toHaveClass('fill');
  });
});
