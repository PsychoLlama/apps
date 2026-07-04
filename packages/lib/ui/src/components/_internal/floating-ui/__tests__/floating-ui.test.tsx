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
});
