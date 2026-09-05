/**
 * Wiring tests for the floating-ui primitive.
 *
 * Covers what the three layers promise today: the root wraps what a
 * window binds to and publishes it, the window wraps the body, and the
 * body renders and styles its children.
 */

import { render, screen } from '@solidjs/testing-library';
import {
  FloatingRoot,
  FloatingBody,
  FloatingWindow,
  type FloatingWindowProps,
} from '..';
import * as css from '../window.css';

/** Unwrap a `createVar()` reference (`var(--x)`) to its property name. */
const varName = (reference: string) => reference.slice(4, -1);

/**
 * A window under the root the primitive requires above it.
 *
 * These are wiring tests: JSDOM runs no layout, and every case here is
 * about what the container renders rather than where the placement
 * visually lands.
 */
const Rooted = (props: FloatingWindowProps) => (
  <FloatingRoot display="block">
    <FloatingWindow {...props} />
  </FloatingRoot>
);

describe('FloatingRoot', () => {
  it('renders the element its display mode calls for', () => {
    const block = render(() => (
      <FloatingRoot display="block" testId="block">
        content
      </FloatingRoot>
    ));
    expect(screen.getByTestId('block').tagName.toLowerCase()).toBe('div');
    block.unmount();

    render(() => (
      <FloatingRoot display="inline" testId="inline">
        content
      </FloatingRoot>
    ));
    expect(screen.getByTestId('inline').tagName.toLowerCase()).toBe('span');
  });

  it('merges a consumer class onto the wrapper', () => {
    render(() => (
      <FloatingRoot display="block" testId="anchor" class="sized">
        content
      </FloatingRoot>
    ));

    expect(screen.getByTestId('anchor')).toHaveClass('sized');
  });

  it('keeps the window a sibling of what it anchors to', () => {
    // A window hanging off the anchored element is what let the anchor's
    // own border, overflow, and stacking context reach the surface.
    // Siblings under the root is the shape that fixes it.
    render(() => (
      <FloatingRoot display="block" testId="anchor">
        <button type="button">trigger</button>
        <FloatingWindow>content</FloatingWindow>
      </FloatingRoot>
    ));
    const wrapper = screen.getByTestId('anchor');

    expect(wrapper.children).toHaveLength(2);
    expect(wrapper.firstElementChild?.tagName.toLowerCase()).toBe('button');
    expect(wrapper.lastElementChild).toHaveAttribute('data-side');
  });

  it('refuses a window with nothing to anchor to', () => {
    // Structural, not conditional: the same failure on the server and in
    // the browser beats silently placing against the viewport.
    expect(() =>
      render(() => <FloatingWindow>content</FloatingWindow>),
    ).toThrow(/outside of <FloatingRoot>/);
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

describe('FloatingWindow', () => {
  it('renders the body children', () => {
    const { container } = render(() => <Rooted>content</Rooted>);

    expect(container).toHaveTextContent('content');
  });

  it('defaults to binding centered below the anchor', () => {
    const { container } = render(() => <Rooted>content</Rooted>);
    const shell = container.querySelector('[data-side]');

    expect(shell).toHaveAttribute('data-side', 'bottom');
    expect(shell).toHaveAttribute('data-align', 'center');
  });

  it('forwards its radius to the body surface', () => {
    const plain = render(() => <Rooted>content</Rooted>);
    const plainBody =
      plain.container.querySelector('[data-side]')!.lastElementChild!.className;
    plain.unmount();

    const { container } = render(() => <Rooted radius={4}>content</Rooted>);
    const body =
      container.querySelector('[data-side]')!.lastElementChild!.className;

    expect(body.split(' ').length).toBe(plainBody.split(' ').length + 1);
  });

  it('forwards body props (test id, padding) onto the body surface', () => {
    const plain = render(() => <Rooted>content</Rooted>);
    const plainBody =
      plain.container.querySelector('[data-side]')!.lastElementChild!.className;
    plain.unmount();

    const { container } = render(() => (
      <Rooted testId="surface" p={4}>
        content
      </Rooted>
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
      <Rooted class="surface">content</Rooted>
    ));
    const body = container.querySelector('[data-side]')!.lastElementChild;

    // The class lands on the body, not the positioning shell.
    expect(container.querySelector('[data-side]')).not.toHaveClass('surface');
    expect(body).toHaveClass('surface');
  });

  it('reflects side and align into data attributes', () => {
    const { container } = render(() => (
      <Rooted side="right" align="end">
        content
      </Rooted>
    ));
    const shell = container.querySelector('[data-side]');

    expect(shell).toHaveAttribute('data-side', 'right');
    expect(shell).toHaveAttribute('data-align', 'end');
  });

  it('omits the arrow when unconfigured', () => {
    const { container } = render(() => <Rooted>content</Rooted>);

    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders the arrow before the body when configured', () => {
    const { container } = render(() => <Rooted arrow={{}}>content</Rooted>);
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
        <Rooted side={side} arrow={{}}>
          content
        </Rooted>
      ));
      const svg = container.querySelector('svg');

      // A horizontal side stands the arrow's box on its end.
      expect(svg).toHaveAttribute('width', width);
      expect(svg).toHaveAttribute('height', height);
    }
  });

  it('passes the arrow alignment through to the arrow', () => {
    const { container } = render(() => (
      <Rooted arrow={{ align: 'end' }}>content</Rooted>
    ));

    expect(container.querySelector('svg')).toHaveAttribute('data-align', 'end');
  });

  it('assigns offsets as inline vars only when provided', () => {
    const plain = render(() => <Rooted>content</Rooted>);
    const plainShell =
      plain.container.querySelector<HTMLElement>('[data-side]')!;

    // Unset props leave the vars unset so the CSS fallbacks apply.
    expect(plainShell.style.getPropertyValue(varName(css.sideOffset))).toBe('');
    expect(plainShell.style.getPropertyValue(varName(css.alignOffset))).toBe(
      '',
    );
    plain.unmount();

    const { container } = render(() => (
      <Rooted sideOffset={8} alignOffset={-4}>
        content
      </Rooted>
    ));
    const shell = container.querySelector<HTMLElement>('[data-side]')!;

    expect(shell.style.getPropertyValue(varName(css.sideOffset))).toBe('8px');
    expect(shell.style.getPropertyValue(varName(css.alignOffset))).toBe('-4px');
  });

  it('enters point mode only when a point is provided', () => {
    const plain = render(() => <Rooted>content</Rooted>);
    expect(plain.container.querySelector('[data-side]')).not.toHaveAttribute(
      'data-point',
    );
    plain.unmount();

    const { container } = render(() => (
      <Rooted point={{ x: 12, y: 34 }} side="right" align="start">
        content
      </Rooted>
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

  it('reflects the resolved placement into data attributes', () => {
    // Nothing measures the page, so the requested placement is always
    // the resolved one — the attributes the CSS keys off say exactly
    // what the caller asked for.
    const { container } = render(() => (
      <FloatingRoot display="block">
        <FloatingWindow side="top" align="end">
          content
        </FloatingWindow>
      </FloatingRoot>
    ));
    const floating = container.querySelector('[data-side]');

    expect(floating).toHaveAttribute('data-side', 'top');
    expect(floating).toHaveAttribute('data-align', 'end');
  });

  it('reflects every side into the data attribute the CSS keys off', () => {
    // Layout (flex-direction) is driven from CSS by `data-side`, so the
    // contract this component owns is reflecting the side faithfully.
    const sides = ['top', 'right', 'bottom', 'left'] as const;

    for (const side of sides) {
      const { container } = render(() => <Rooted side={side}>content</Rooted>);
      const shell = container.querySelector('[data-side]');

      expect(shell).toHaveAttribute('data-side', side);
    }
  });
});
