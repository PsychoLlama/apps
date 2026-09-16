/**
 * Wiring tests for the floating-ui primitive.
 *
 * Covers what the three layers promise today: the root wraps what a
 * window binds to and publishes it, the window positions whatever it's
 * given, and the body renders and styles its children.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
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
const Rooted = (
  props: Omit<FloatingWindowProps, 'testId'> & Partial<FloatingWindowProps>,
) => (
  <FloatingRoot display="block">
    <FloatingWindow testId="box" {...props} />
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

  it('forwards native attributes and handlers to the wrapper', () => {
    const onFocusOut = vi.fn();
    render(() => (
      <FloatingRoot
        display="block"
        testId="anchor"
        data-state="open"
        onFocusOut={onFocusOut}
      >
        <button>focusable</button>
      </FloatingRoot>
    ));

    expect(screen.getByTestId('anchor')).toHaveAttribute('data-state', 'open');
    fireEvent.focusOut(screen.getByRole('button'));
    expect(onFocusOut).toHaveBeenCalledOnce();
  });

  it('hands the wrapper to `ref` and still anchors its windows', () => {
    // The root keeps a ref of its own on the same node; a consumer's
    // composes with it rather than replacing it.
    let element: HTMLElement | undefined;
    render(() => (
      <FloatingRoot
        display="block"
        testId="anchor"
        ref={(el: HTMLElement) => (element = el)}
      >
        <button>anchored</button>
        <FloatingWindow testId="window">content</FloatingWindow>
      </FloatingRoot>
    ));

    expect(element).toBe(screen.getByTestId('anchor'));
    expect(screen.getByTestId('window').parentElement).toBe(element);
  });

  it('keeps the window a sibling of what it anchors to', () => {
    // A window hanging off the anchored element is what let the anchor's
    // own border, overflow, and stacking context reach the surface.
    // Siblings under the root is the shape that fixes it.
    render(() => (
      <FloatingRoot display="block" testId="anchor">
        <button type="button">trigger</button>
        <FloatingWindow testId="box">content</FloatingWindow>
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
      render(() => <FloatingWindow testId="box">content</FloatingWindow>),
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
});

describe('FloatingWindow', () => {
  it('renders its children', () => {
    const { container } = render(() => <Rooted>content</Rooted>);

    expect(container).toHaveTextContent('content');
  });

  it('defaults to binding centered below the anchor', () => {
    const { container } = render(() => <Rooted>content</Rooted>);
    const shell = container.querySelector('[data-side]');

    expect(shell).toHaveAttribute('data-side', 'bottom');
    expect(shell).toHaveAttribute('data-align', 'center');
  });

  it('adds a radius class to the box only when a radius is set', () => {
    // The radius is one class on the box: it sets the vars the surface
    // and the arrow read, so neither carries a class of its own.
    const plain = render(() => <Rooted>content</Rooted>);
    const plainBox = plain.container.querySelector('[data-side]')!.className;
    plain.unmount();

    const { container } = render(() => <Rooted radius={4}>content</Rooted>);
    const box = container.querySelector('[data-side]')!.className;

    expect(box.split(' ').length).toBe(plainBox.split(' ').length + 1);
  });

  it('puts the test id and class on the box', () => {
    render(() => (
      <Rooted testId="box" class="custom">
        content
      </Rooted>
    ));
    const box = screen.getByTestId('box');

    expect(box).toHaveAttribute('data-side');
    expect(box).toHaveClass('custom');
  });

  it('wraps the surface it is given', () => {
    render(() => (
      <Rooted testId="box">
        <FloatingBody testId="surface" class="custom">
          content
        </FloatingBody>
      </Rooted>
    ));
    const box = screen.getByTestId('box');
    const surface = screen.getByTestId('surface');

    expect(box.lastElementChild).toBe(surface);
    expect(box).not.toHaveClass('custom');
    expect(surface).toHaveClass('custom');
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

  it('derives the axis the side travels on', () => {
    const vertical = render(() => <Rooted side="top">content</Rooted>);
    expect(vertical.container.querySelector('[data-side]')).toHaveAttribute(
      'data-axis',
      'y',
    );
    vertical.unmount();

    const { container } = render(() => <Rooted side="left">content</Rooted>);
    expect(container.querySelector('[data-side]')).toHaveAttribute(
      'data-axis',
      'x',
    );
  });

  it('omits the arrow when unconfigured', () => {
    const { container } = render(() => <Rooted>content</Rooted>);

    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders the arrow before its children when configured', () => {
    const { container } = render(() => <Rooted arrow={{}}>content</Rooted>);
    const shell = container.querySelector('[data-side]');

    // Arrow first so the surface paints over its shadow seam.
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

  it("seats the arrow with the window's own alignment", () => {
    const { container } = render(() => (
      <Rooted align="end" arrow={{}}>
        content
      </Rooted>
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
        <FloatingWindow testId="box" side="top" align="end">
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

describe('FloatingWindow passthrough', () => {
  it('forwards native attributes and handlers to the box', () => {
    const onPointerEnter = vi.fn();
    render(() => (
      <Rooted testId="box" data-state="open" onPointerEnter={onPointerEnter}>
        content
      </Rooted>
    ));

    const box = screen.getByTestId('box');
    expect(box).toHaveAttribute('data-state', 'open');
    fireEvent.pointerEnter(box);
    expect(onPointerEnter).toHaveBeenCalledOnce();
  });

  it('merges consumer styles under its own placement vars', () => {
    // A runtime value, as the prop is for; a static one belongs in a class.
    const consumer = { color: 'red', [varName(css.sideOffset)]: '1px' };
    render(() => (
      <Rooted testId="box" sideOffset={8} style={consumer}>
        content
      </Rooted>
    ));
    const box = screen.getByTestId('box');

    expect(box.style.color).toBe('red');
    // The window's own var wins over a consumer's attempt at it.
    expect(box.style.getPropertyValue(varName(css.sideOffset))).toBe('8px');
  });

  it('hands the box element to `ref`', () => {
    // The window keeps a ref of its own on the same node; a consumer's
    // composes with it rather than replacing it.
    let element: HTMLDivElement | undefined;
    render(() => (
      <Rooted testId="box" ref={(el: HTMLDivElement) => (element = el)}>
        content
      </Rooted>
    ));

    expect(element).toBe(screen.getByTestId('box'));
  });
});

describe('FloatingBody passthrough', () => {
  it('forwards identity and ARIA attributes to the surface', () => {
    render(() => (
      <FloatingBody
        testId="surface"
        id="popup"
        role="menu"
        tabIndex={-1}
        aria-label="Actions"
        aria-labelledby="trigger"
        aria-describedby="hint"
        aria-orientation="vertical"
      >
        content
      </FloatingBody>
    ));

    const surface = screen.getByTestId('surface');
    expect(surface.id).toBe('popup');
    expect(surface).toHaveAttribute('role', 'menu');
    expect(surface.tabIndex).toBe(-1);
    expect(surface).toHaveAttribute('aria-label', 'Actions');
    expect(surface).toHaveAttribute('aria-labelledby', 'trigger');
    expect(surface).toHaveAttribute('aria-describedby', 'hint');
    expect(surface).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('attaches no semantics of its own', () => {
    render(() => <FloatingBody testId="surface">content</FloatingBody>);

    const surface = screen.getByTestId('surface');
    expect(surface).not.toHaveAttribute('role');
    expect(surface).not.toHaveAttribute('tabindex');
    expect(surface).not.toHaveAttribute('id');
  });

  it('hands the surface element to `ref`', () => {
    let element: HTMLDivElement | undefined;
    render(() => (
      <FloatingBody
        testId="surface"
        ref={(el: HTMLDivElement) => (element = el)}
      >
        content
      </FloatingBody>
    ));

    expect(element).toBe(screen.getByTestId('surface'));
  });

  it('forwards event handlers to the surface', () => {
    const onKeyDown = vi.fn();
    const onFocusIn = vi.fn();
    const onPointerMove = vi.fn();
    render(() => (
      <FloatingBody
        testId="surface"
        onKeyDown={onKeyDown}
        onFocusIn={onFocusIn}
        onPointerMove={onPointerMove}
      >
        content
      </FloatingBody>
    ));

    const surface = screen.getByTestId('surface');
    fireEvent.keyDown(surface, { key: 'ArrowDown' });
    fireEvent.focusIn(surface);
    fireEvent.pointerMove(surface);

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onFocusIn).toHaveBeenCalledOnce();
    expect(onPointerMove).toHaveBeenCalledOnce();
  });
});
