import {
  createContext,
  createSignal,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { type TestIdProps } from '../../../props/test-id';
import * as css from './root.css';

/**
 * The anchor element every floating surface below a {@link FloatingRoot}
 * positions against.
 *
 * An accessor rather than the element itself: a `ref` lands after the
 * first render, and anything reading the element has to wake up when it
 * does.
 */
const AnchorContext = createContext<Accessor<HTMLElement | undefined>>();

/**
 * Read the nearest anchor element. Throws outside a
 * {@link FloatingRoot} — a floating surface with nothing to anchor to is
 * a structural mistake in the tree, not a runtime condition, so it fails
 * the same way on the server and in the browser.
 */
export const useAnchorElement = (): Accessor<HTMLElement | undefined> => {
  const anchor = useContext(AnchorContext);

  if (!anchor) {
    throw new Error('<FloatingWindow> rendered outside of <FloatingRoot>.');
  }

  return anchor;
};

/** How the root wrapper participates in the surrounding flow. */
export type FloatingRootDisplay = 'block' | 'inline';

/** The element each display mode renders as. */
const TAG_BY_DISPLAY: Record<FloatingRootDisplay, 'div' | 'span'> = {
  block: 'div',
  inline: 'span',
};

/** Props for the root of a floating primitive. */
export interface FloatingRootProps extends TestIdProps {
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
 * surface in a stacking context it can't escape.
 *
 * ```tsx
 * <FloatingRoot display="block">
 *   <button>Open</button>
 *   <FloatingWindow>…</FloatingWindow>
 * </FloatingRoot>
 * ```
 */
export const FloatingRoot = (props: FloatingRootProps) => {
  const [element, setElement] = createSignal<HTMLElement>();

  const className = () =>
    [css.root[props.display], props.class].filter(Boolean).join(' ');

  return (
    <AnchorContext.Provider value={element}>
      <Dynamic
        component={TAG_BY_DISPLAY[props.display]}
        ref={setElement}
        class={className()}
        data-testid={props.testId}
      >
        {props.children}
      </Dynamic>
    </AnchorContext.Provider>
  );
};
