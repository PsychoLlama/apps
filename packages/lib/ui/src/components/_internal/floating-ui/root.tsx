import {
  createContext,
  createSignal,
  splitProps,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { assert } from '@lib/assert';
import clx from '@lib/classnames';
import { type TestIdProps } from '../../../props/test-id';
import * as css from './root.css';

/**
 * The anchor element every floating window below a {@link FloatingRoot}
 * positions against.
 *
 * An accessor rather than the element itself: a `ref` lands after the
 * first render, and anything reading the element has to wake up when it
 * does.
 */
const AnchorContext = createContext<Accessor<HTMLElement | undefined>>();

/**
 * Read the nearest anchor element. Throws outside a
 * {@link FloatingRoot} — a floating window with nothing to anchor to is
 * a structural mistake in the tree, not a runtime condition, so it fails
 * the same way on the server and in the browser.
 */
export const useAnchorElement = (): Accessor<HTMLElement | undefined> => {
  const anchor = useContext(AnchorContext);

  assert(anchor, '<FloatingWindow> rendered outside of <FloatingRoot>.');

  return anchor;
};

/** How the root wrapper participates in the surrounding flow. */
export type FloatingRootDisplay = 'block' | 'inline';

/** The element each display mode renders as. */
const TAG_BY_DISPLAY: Record<FloatingRootDisplay, 'div' | 'span'> = {
  block: 'div',
  inline: 'span',
};

/**
 * Props for the root of a floating primitive.
 *
 * Every native attribute and handler passes through to the wrapper.
 * It's the one element that contains both the anchored element and the
 * windows bound to it, so it's where a floating component listens for
 * focus and pointer crossing between the two, and the element it hands
 * to anything that needs "the trigger and its popup" as one box.
 */
export interface FloatingRootProps
  extends TestIdProps, JSX.HTMLAttributes<HTMLElement> {
  /**
   * How the wrapper sits in the surrounding flow: `block` renders a
   * `<div>`, `inline` a `<span>`. Required rather than defaulted —
   * the wrong choice is either invalid markup inside a paragraph or a
   * stray baseline gap under a layout box, and neither is a failure the
   * component can detect for you.
   */
  display: FloatingRootDisplay;
  /**
   * Class merged onto the wrapper. The escape hatch for the sizing the
   * wrapper can't infer: it shrink-wraps to its content, so an anchor
   * meant to stretch is sized here instead of on the element inside.
   */
  class?: string;
  /**
   * The element being anchored to, alongside the
   * {@link FloatingWindow}s bound to it — siblings of that element, not
   * children of it.
   */
  children: JSX.Element;
}

/**
 * The root of a floating primitive: it wraps the element being anchored
 * to and publishes that box to every {@link FloatingWindow} inside.
 *
 * The wrapper exists so the placement resolves against the anchor's
 * outer edge. Percentages resolve against the positioning ancestor's
 * padding box, so anchoring to the element itself would place the window
 * inside its border. Owning an unstyled element of our own keeps the two
 * the same rectangle, whatever border the anchored element carries (see
 * `root` in `root.css`).
 *
 * Windows are siblings of the anchored element rather than children of
 * it, which also keeps the anchor's own `overflow` from clipping its
 * popup and its own `transform`/`opacity`/`filter` from trapping the
 * window in a stacking context it can't escape.
 *
 * ```tsx
 * <FloatingRoot display="block">
 *   <button>Open</button>
 *   <FloatingWindow>…</FloatingWindow>
 * </FloatingRoot>
 * ```
 */
export const FloatingRoot = (props: FloatingRootProps) => {
  const [local, passthrough] = splitProps(props, [
    'display',
    'class',
    'ref',
    'testId',
    'children',
  ]);

  const [element, setElement] = createSignal<HTMLElement>();
  const className = () => clx(css.root[local.display], local.class);

  // The root keeps a ref of its own on the wrapper, for the anchor
  // context; a consumer's composes with it. Solid hands a component a
  // function whichever form the consumer wrote.
  const setAnchor = (wrapper: HTMLElement) => {
    setElement(wrapper);
    if (typeof local.ref === 'function') local.ref(wrapper);
  };

  return (
    <AnchorContext.Provider value={element}>
      <Dynamic
        component={TAG_BY_DISPLAY[local.display]}
        {...passthrough}
        ref={setAnchor}
        class={className()}
        data-testid={local.testId}
      >
        {local.children}
      </Dynamic>
    </AnchorContext.Provider>
  );
};
