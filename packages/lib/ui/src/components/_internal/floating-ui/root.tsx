import {
  createMemo,
  createSignal,
  splitProps,
  type Accessor,
  type JSX,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clx from '@lib/classnames';
import { type TestIdProps } from '../../../props/test-id';
import { FloatingContext, useFloatingContext } from './context';
import { type TetherState } from './tether/use-tether';
import * as css from './root.css';

/**
 * Read the anchor element every floating window below the nearest
 * {@link FloatingRoot} positions against. Throws outside a root.
 */
export const useAnchorElement = (): Accessor<HTMLElement | undefined> =>
  useFloatingContext().anchor;

/** How the root wrapper participates in the surrounding flow. */
export type FloatingRootDisplay = 'block' | 'inline';

/** The element a part of the primitive renders as. */
export type FloatingTag = 'div' | 'span';

/** The DOM element behind a {@link FloatingTag}. */
export type FloatingElement = HTMLElementTagNameMap[FloatingTag];

/** The element each display mode renders as. */
const TAG_BY_DISPLAY: Record<FloatingRootDisplay, FloatingTag> = {
  block: 'div',
  inline: 'span',
};

/**
 * Read the element the nearest {@link FloatingRoot} renders as, for a
 * part inside it to render as the same. An inline root's content is
 * phrasing content, so everything under it is a `<span>`: a `<div>` in
 * a paragraph is closed out of it by the parser, which breaks
 * hydration. Throws outside a root.
 */
export const useFloatingTag = (): Accessor<FloatingTag> => {
  const { display } = useFloatingContext();

  return () => TAG_BY_DISPLAY[display()];
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
   * `<div>`, `inline` a `<span>`, and every part inside follows suit.
   * Required rather than defaulted —
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
   * {@link FloatingWindow} bound to it — a sibling of that element, not
   * a child of it.
   *
   * One window per root. The root holds a single slot for where that
   * window landed, so a second one has nowhere to report and throws.
   * Two popups off one trigger means two roots.
   */
  children: JSX.Element;
}

/**
 * The root of a floating primitive: it wraps the element being anchored
 * to and publishes that box to the {@link FloatingWindow} inside.
 *
 * It's also where that window publishes back. The root holds the slot
 * for the resolved placement, so anything between the two — the
 * component that rendered them, the trigger beside the window — can
 * read where the window landed through `useTetherState` without being
 * handed it.
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
  const display = createMemo(() => local.display);
  const className = () => clx(css.root[display()], local.class);

  // The slot the window inside publishes its tether state into. Empty
  // until it does, and the root never looks at it — it only holds it
  // open for the two ends to find each other.
  const [tether, setTether] = createSignal<TetherState>();

  // The root keeps a ref of its own on the wrapper, for the anchor in
  // its context; a consumer's composes with it. Solid hands a component a
  // function whichever form the consumer wrote.
  const setAnchor = (wrapper: HTMLElement) => {
    setElement(wrapper);
    if (typeof local.ref === 'function') local.ref(wrapper);
  };

  return (
    <FloatingContext.Provider
      value={{ anchor: element, tether: [tether, setTether], display }}
    >
      <Dynamic
        component={TAG_BY_DISPLAY[display()]}
        {...passthrough}
        ref={setAnchor}
        class={className()}
        data-testid={local.testId}
      >
        {local.children}
      </Dynamic>
    </FloatingContext.Provider>
  );
};
