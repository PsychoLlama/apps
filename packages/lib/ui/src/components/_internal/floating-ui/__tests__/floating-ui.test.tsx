/**
 * Wiring tests for the floating-ui primitive.
 *
 * Covers what the three layers promise today: the anchor wraps what a
 * surface binds to and publishes it, the container wraps the body, and
 * the body renders and styles its children.
 */

import { render, screen } from '@solidjs/testing-library';
import {
  FloatingAnchor,
  FloatingBody,
  FloatingContainer,
  type FloatingContainerProps,
} from '../floating-ui';
import * as css from '../floating-ui.css';

/** Unwrap a `createVar()` reference (`var(--x)`) to its property name. */
const varName = (reference: string) => reference.slice(4, -1);

/**
 * A container under the anchor the primitive requires above it.
 *
 * These are wiring tests, so the tether stands down throughout — JSDOM
 * runs no layout, and every case here is about what the container
 * renders rather than where a measured placement lands.
 */
const Anchored = (props: Omit<FloatingContainerProps, 'tether'>) => (
  <FloatingAnchor display="block">
    <FloatingContainer {...props} tether={false} />
  </FloatingAnchor>
);

describe('FloatingAnchor', () => {
  it('renders the element its display mode calls for', () => {
    const block = render(() => (
      <FloatingAnchor display="block" testId="block">
        content
      </FloatingAnchor>
    ));
    expect(screen.getByTestId('block').tagName.toLowerCase()).toBe('div');
    block.unmount();

    render(() => (
      <FloatingAnchor display="inline" testId="inline">
        content
      </FloatingAnchor>
    ));
    expect(screen.getByTestId('inline').tagName.toLowerCase()).toBe('span');
  });

  it('merges a consumer class onto the wrapper', () => {
    render(() => (
      <FloatingAnchor display="block" testId="anchor" class="sized">
        content
      </FloatingAnchor>
    ));

    expect(screen.getByTestId('anchor')).toHaveClass('sized');
  });

  it('keeps the surface a sibling of what it anchors to', () => {
    // The container hanging off the anchored element is what let the
    // anchor's own border, overflow, and stacking context reach the
    // surface. Siblings under the wrapper is the shape that fixes it.
    render(() => (
      <FloatingAnchor display="block" testId="anchor">
        <button type="button">trigger</button>
        <FloatingContainer tether={false}>content</FloatingContainer>
      </FloatingAnchor>
    ));
    const wrapper = screen.getByTestId('anchor');

    expect(wrapper.children).toHaveLength(2);
    expect(wrapper.firstElementChild?.tagName.toLowerCase()).toBe('button');
    expect(wrapper.lastElementChild).toHaveAttribute('data-side');
  });

  it('refuses a surface with nothing to anchor to', () => {
    // Structural, not conditional: the same failure on the server and in
    // the browser beats silently placing against the viewport.
    expect(() =>
      render(() => (
        <FloatingContainer tether={false}>content</FloatingContainer>
      )),
    ).toThrow(/outside of <FloatingAnchor>/);
  });
});

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
    const { container } = render(() => <Anchored>content</Anchored>);

    expect(container).toHaveTextContent('content');
  });

  it('defaults to binding centered below the anchor', () => {
    const { container } = render(() => <Anchored>content</Anchored>);
    const shell = container.querySelector('[data-side]');

    expect(shell).toHaveAttribute('data-side', 'bottom');
    expect(shell).toHaveAttribute('data-align', 'center');
  });

  it('forwards its radius to the body surface', () => {
    const plain = render(() => <Anchored>content</Anchored>);
    const plainBody =
      plain.container.querySelector('[data-side]')!.lastElementChild!.className;
    plain.unmount();

    const { container } = render(() => <Anchored radius={4}>content</Anchored>);
    const body =
      container.querySelector('[data-side]')!.lastElementChild!.className;

    expect(body.split(' ').length).toBe(plainBody.split(' ').length + 1);
  });

  it('forwards body props (test id, padding) onto the body surface', () => {
    const plain = render(() => <Anchored>content</Anchored>);
    const plainBody =
      plain.container.querySelector('[data-side]')!.lastElementChild!.className;
    plain.unmount();

    const { container } = render(() => (
      <Anchored testId="surface" p={4}>
        content
      </Anchored>
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
      <Anchored class="surface">content</Anchored>
    ));
    const body = container.querySelector('[data-side]')!.lastElementChild;

    // The class lands on the body, not the positioning shell.
    expect(container.querySelector('[data-side]')).not.toHaveClass('surface');
    expect(body).toHaveClass('surface');
  });

  it('reflects side and align into data attributes', () => {
    const { container } = render(() => (
      <Anchored side="right" align="end">
        content
      </Anchored>
    ));
    const shell = container.querySelector('[data-side]');

    expect(shell).toHaveAttribute('data-side', 'right');
    expect(shell).toHaveAttribute('data-align', 'end');
  });

  it('omits the arrow by default', () => {
    const { container } = render(() => <Anchored>content</Anchored>);

    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders the arrow before the body when visible', () => {
    const { container } = render(() => (
      <Anchored arrow={{ visible: true }}>content</Anchored>
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
        <Anchored side={side} arrow={{ visible: true }}>
          content
        </Anchored>
      ));
      const svg = container.querySelector('svg');

      // A horizontal side stands the arrow's box on its end.
      expect(svg).toHaveAttribute('width', width);
      expect(svg).toHaveAttribute('height', height);
    }
  });

  it('passes the arrow alignment through to the arrow', () => {
    const { container } = render(() => (
      <Anchored arrow={{ visible: true, align: 'end' }}>content</Anchored>
    ));

    expect(container.querySelector('svg')).toHaveAttribute('data-align', 'end');
  });

  it('assigns offsets as inline vars only when provided', () => {
    const plain = render(() => <Anchored>content</Anchored>);
    const plainShell =
      plain.container.querySelector<HTMLElement>('[data-side]')!;

    // Unset props leave the vars unset so the CSS fallbacks apply.
    expect(plainShell.style.getPropertyValue(varName(css.sideOffset))).toBe('');
    expect(plainShell.style.getPropertyValue(varName(css.alignOffset))).toBe(
      '',
    );
    plain.unmount();

    const { container } = render(() => (
      <Anchored sideOffset={8} alignOffset={-4}>
        content
      </Anchored>
    ));
    const shell = container.querySelector<HTMLElement>('[data-side]')!;

    expect(shell.style.getPropertyValue(varName(css.sideOffset))).toBe('8px');
    expect(shell.style.getPropertyValue(varName(css.alignOffset))).toBe('-4px');
  });

  it('enters point mode only when a point is provided', () => {
    const plain = render(() => <Anchored>content</Anchored>);
    expect(plain.container.querySelector('[data-side]')).not.toHaveAttribute(
      'data-point',
    );
    plain.unmount();

    const { container } = render(() => (
      <Anchored point={{ x: 12, y: 34 }} side="right" align="start">
        content
      </Anchored>
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

  it('leaves the CSS placement in charge while the tether stands down', () => {
    // `tether={false}` is the pre-hydration state held open: however the
    // passes were configured, nothing measures and nothing moves.
    const { container } = render(() => (
      <FloatingAnchor display="block">
        <FloatingContainer side="top" align="end" tether={false}>
          content
        </FloatingContainer>
      </FloatingAnchor>
    ));
    const floating = container.querySelector('[data-side]');

    expect(floating).toHaveAttribute('data-side', 'top');
    expect(floating).toHaveAttribute('data-align', 'end');
    expect(floating).not.toHaveAttribute('data-tethered');
  });

  it('reflects every side into the data attribute the CSS keys off', () => {
    // Layout (flex-direction) is driven from CSS by `data-side`, so the
    // contract this component owns is reflecting the side faithfully.
    const sides = ['top', 'right', 'bottom', 'left'] as const;

    for (const side of sides) {
      const { container } = render(() => (
        <Anchored side={side}>content</Anchored>
      ));
      const shell = container.querySelector('[data-side]');

      expect(shell).toHaveAttribute('data-side', side);
    }
  });
});
