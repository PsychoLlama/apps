/**
 * Wiring tests for the floating-ui pointer arrow.
 *
 * Covers what the arrow promises: it sizes to its props, rotates to face
 * the anchor, and merges a consumer class.
 */

import { render } from '@solidjs/testing-library';
import { Arrow } from '../arrow';

describe('Arrow', () => {
  it('defaults to a 12×6 up-pointing triangle', () => {
    const { container } = render(() => <Arrow />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '12');
    expect(svg).toHaveAttribute('height', '6');
    expect(svg?.style.transform).toBe('rotate(0deg)');
  });

  it('sizes and rotates from its props', () => {
    const { container } = render(() => (
      <Arrow width={16} height={8} rotate="90deg" />
    ));
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '8');
    expect(svg?.style.transform).toBe('rotate(90deg)');
  });

  it('merges a consumer class', () => {
    const { container } = render(() => <Arrow class="fill" />);

    expect(container.querySelector('svg')).toHaveClass('fill');
  });
});
