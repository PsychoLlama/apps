/**
 * Wiring tests for the floating-ui primitive.
 *
 * Covers what the two layers promise today: the body renders and styles
 * its children, and the container wraps the body.
 */

import { render, screen } from '@solidjs/testing-library';
import { FloatingBody, FloatingContainer } from '../floating-ui';

describe('FloatingBody', () => {
  it('renders its children', () => {
    render(() => <FloatingBody testId="body">content</FloatingBody>);

    expect(screen.getByTestId('body')).toHaveTextContent('content');
  });

  it('merges a consumer class onto the surface', () => {
    render(() => (
      <FloatingBody testId="body" class="custom">
        content
      </FloatingBody>
    ));

    expect(screen.getByTestId('body')).toHaveClass('custom');
  });
});

describe('FloatingContainer', () => {
  it('renders the body children', () => {
    const { container } = render(() => (
      <FloatingContainer>content</FloatingContainer>
    ));

    expect(container).toHaveTextContent('content');
  });

  it('defaults to binding centered below the anchor', () => {
    const { container } = render(() => (
      <FloatingContainer>content</FloatingContainer>
    ));
    const shell = container.querySelector('[data-side]');

    expect(shell).toHaveAttribute('data-side', 'bottom');
    expect(shell).toHaveAttribute('data-align', 'center');
  });

  it('reflects side and align into data attributes', () => {
    const { container } = render(() => (
      <FloatingContainer side="right" align="end">
        content
      </FloatingContainer>
    ));
    const shell = container.querySelector('[data-side]');

    expect(shell).toHaveAttribute('data-side', 'right');
    expect(shell).toHaveAttribute('data-align', 'end');
  });

  it('omits the arrow by default', () => {
    const { container } = render(() => (
      <FloatingContainer>content</FloatingContainer>
    ));

    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders the arrow before the body when visible', () => {
    const { container } = render(() => (
      <FloatingContainer arrow={{ visible: true }}>content</FloatingContainer>
    ));
    const shell = container.querySelector('[data-side]');

    // Arrow first so the body paints over its shadow seam.
    expect(shell?.firstElementChild?.tagName.toLowerCase()).toBe('svg');
  });

  it('points the arrow toward the anchor per side', () => {
    const cases = [
      { side: 'bottom', width: '12', height: '6' },
      { side: 'left', width: '6', height: '12' },
    ] as const;

    for (const { side, width, height } of cases) {
      const { container } = render(() => (
        <FloatingContainer side={side} arrow={{ visible: true }}>
          content
        </FloatingContainer>
      ));
      const svg = container.querySelector('svg');

      // A horizontal side stands the arrow's box on its end.
      expect(svg).toHaveAttribute('width', width);
      expect(svg).toHaveAttribute('height', height);
    }
  });

  it('passes the arrow alignment through to the arrow', () => {
    const { container } = render(() => (
      <FloatingContainer arrow={{ visible: true, align: 'end' }}>
        content
      </FloatingContainer>
    ));

    expect(container.querySelector('svg')).toHaveAttribute('data-align', 'end');
  });

  it('reflects every side into the data attribute the CSS keys off', () => {
    // Layout (flex-direction) is driven from CSS by `data-side`, so the
    // contract this component owns is reflecting the side faithfully.
    const sides = ['top', 'right', 'bottom', 'left'] as const;

    for (const side of sides) {
      const { container } = render(() => (
        <FloatingContainer side={side}>content</FloatingContainer>
      ));
      const shell = container.querySelector('[data-side]');

      expect(shell).toHaveAttribute('data-side', side);
    }
  });
});
