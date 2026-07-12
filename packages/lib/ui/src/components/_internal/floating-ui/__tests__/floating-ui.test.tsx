/**
 * Wiring tests for the floating-ui primitive.
 *
 * Covers what the two layers promise today: the body renders and styles
 * its children, and the container wraps the body.
 */

import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { FloatingBody, FloatingContainer, tetherPlugins } from '../floating-ui';
import * as css from '../floating-ui.css';

/** Unwrap a `createVar()` reference (`var(--x)`) to its property name. */
const varName = (reference: string) => reference.slice(4, -1);

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

  it('adds a radius class only when a radius is set', () => {
    const { unmount } = render(() => (
      <FloatingBody testId="plain">content</FloatingBody>
    ));
    const plain = screen.getByTestId('plain').className;
    unmount();

    render(() => (
      <FloatingBody testId="rounded" radius={4}>
        content
      </FloatingBody>
    ));
    const rounded = screen.getByTestId('rounded').className;

    // The radius step contributes exactly one extra class.
    expect(rounded.split(' ').length).toBe(plain.split(' ').length + 1);
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

  it('forwards its radius to the body surface', () => {
    const plain = render(() => <FloatingContainer>content</FloatingContainer>);
    const plainBody =
      plain.container.querySelector('[data-side]')!.lastElementChild!.className;
    plain.unmount();

    const { container } = render(() => (
      <FloatingContainer radius={4}>content</FloatingContainer>
    ));
    const body =
      container.querySelector('[data-side]')!.lastElementChild!.className;

    expect(body.split(' ').length).toBe(plainBody.split(' ').length + 1);
  });

  it('forwards body props (test id, padding) onto the body surface', () => {
    const plain = render(() => <FloatingContainer>content</FloatingContainer>);
    const plainBody =
      plain.container.querySelector('[data-side]')!.lastElementChild!.className;
    plain.unmount();

    const { container } = render(() => (
      <FloatingContainer testId="surface" p={4}>
        content
      </FloatingContainer>
    ));
    const body = screen.getByTestId('surface');

    // The test id lands on the body, and padding contributes its class.
    expect(container.querySelector('[data-side]')).not.toHaveAttribute(
      'data-testid',
    );
    expect(body).toBe(container.querySelector('[data-side]')!.lastElementChild);
    expect(body.className.split(' ').length).toBe(
      plainBody.split(' ').length + 1,
    );
  });

  it('forwards a consumer class onto the body surface', () => {
    const { container } = render(() => (
      <FloatingContainer class="surface">content</FloatingContainer>
    ));
    const body = container.querySelector('[data-side]')!.lastElementChild;

    // The class lands on the body, not the positioning shell.
    expect(container.querySelector('[data-side]')).not.toHaveClass('surface');
    expect(body).toHaveClass('surface');
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

  it('assigns offsets as inline vars only when provided', () => {
    const plain = render(() => <FloatingContainer>content</FloatingContainer>);
    const plainShell =
      plain.container.querySelector<HTMLElement>('[data-side]')!;

    // Unset props leave the vars unset so the CSS fallbacks apply.
    expect(plainShell.style.getPropertyValue(varName(css.sideOffset))).toBe('');
    expect(plainShell.style.getPropertyValue(varName(css.alignOffset))).toBe(
      '',
    );
    plain.unmount();

    const { container } = render(() => (
      <FloatingContainer sideOffset={8} alignOffset={-4}>
        content
      </FloatingContainer>
    ));
    const shell = container.querySelector<HTMLElement>('[data-side]')!;

    expect(shell.style.getPropertyValue(varName(css.sideOffset))).toBe('8px');
    expect(shell.style.getPropertyValue(varName(css.alignOffset))).toBe('-4px');
  });

  it('enters point mode only when a point is provided', () => {
    const plain = render(() => <FloatingContainer>content</FloatingContainer>);
    expect(plain.container.querySelector('[data-side]')).not.toHaveAttribute(
      'data-point',
    );
    plain.unmount();

    const { container } = render(() => (
      <FloatingContainer point={{ x: 12, y: 34 }} side="right" align="start">
        content
      </FloatingContainer>
    ));
    const shell = container.querySelector<HTMLElement>('[data-side]')!;

    // The mode flag and coordinates land on the shell; side/align still
    // reflect so the CSS can pick the growth direction.
    expect(shell).toHaveAttribute('data-point');
    expect(shell.style.getPropertyValue(varName(css.pointX))).toBe('12px');
    expect(shell.style.getPropertyValue(varName(css.pointY))).toBe('34px');
    expect(shell).toHaveAttribute('data-side', 'right');
    expect(shell).toHaveAttribute('data-align', 'start');
  });

  it('degrades to the pure-CSS placement where observers are missing', () => {
    // jsdom has no ResizeObserver — exactly the environments the
    // tether must silently sit out of.
    const [anchorElement, setAnchorElement] = createSignal<HTMLElement>();
    const { container } = render(() => (
      <div ref={setAnchorElement}>
        <FloatingContainer
          anchor={anchorElement()}
          side="top"
          align="end"
          tether={{
            plugins: [tetherPlugins.positionTry([{ side: 'bottom' }])],
          }}
        >
          content
        </FloatingContainer>
      </div>
    ));
    const shell = container.querySelector('[data-side]');

    expect(shell).toHaveAttribute('data-side', 'top');
    expect(shell).toHaveAttribute('data-align', 'end');
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
