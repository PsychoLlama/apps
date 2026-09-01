import {
  createContext,
  createSignal,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { type TestIdProps } from '../../../props/test-id';
import * as css from './floating-ui.css';

/**
 * The anchor element every floating surface below a {@link FloatingAnchor}
 * positions against.
 *
 * An accessor rather than the element itself: a `ref` lands after the
 * first render, and the tether has to wake up when it does.
 */
const FloatingAnchorContext =
  createContext<Accessor<HTMLElement | undefined>>();

/**
 * Read the nearest anchor element. Throws outside a
 * {@link FloatingAnchor} — a floating surface with nothing to anchor to
 * is a structural mistake in the tree, not a runtime condition, so it
 * fails the same way on the server and in the browser.
 */
export const useFloatingAnchor = (): Accessor<HTMLElement | undefined> => {
  const anchor = useContext(FloatingAnchorContext);

  if (!anchor) {
    throw new Error(
      '<FloatingContainer> rendered outside of <FloatingAnchor>.',
    );
  }

  return anchor;
};

/** How the anchor wrapper participates in the surrounding flow. */
export type FloatingAnchorDisplay = 'block' | 'inline';

/** The element each display mode renders as. */
const TAG_BY_DISPLAY: Record<FloatingAnchorDisplay, 'div' | 'span'> = {
  block: 'div',
  inline: 'span',
};

/** Props for the anchor wrapper. */
export interface FloatingAnchorProps extends TestIdProps {
  /**
   * How the wrapper sits in the surrounding flow: `block` renders a
   * `<div>`, `inline` a `<span>`. Required rather than defaulted —
   * the wrong choice is either invalid markup inside a paragraph or a
   * stray baseline gap under a layout box, and neither is a failure the
   * component can detect for you.
   */
  display: FloatingAnchorDisplay;
  /**
   * Class merged onto the wrapper. The escape hatch for the sizing the
   * wrapper can't infer: it shrink-wraps to its content, so an anchor
   * meant to stretch is sized here instead of on the element inside.
   */
  class?: string;
  /**
   * The element being anchored to, alongside the
   * {@link FloatingContainer}s bound to it — siblings of that element,
   * not children of it.
   */
  children: JSX.Element;
}

/**
 * Marks the box a floating surface anchors to, and publishes it to every
 * {@link FloatingContainer} inside.
 *
 * The wrapper exists so the two placement paths agree on where the
 * anchor's edges are. The pure-CSS placement resolves against this
 * element's padding box; the tether measures a border box. Owning an
 * unstyled element of our own is what makes those the same rectangle,
 * whatever border the anchored element carries (see `anchor` in
 * `floating-ui.css`).
 *
 * Surfaces are siblings of the anchored element rather than children of
 * it, which also keeps the anchor's own `overflow` from clipping its
 * popup and its own `transform`/`opacity`/`filter` from trapping the
 * surface in a stacking context it can't escape.
 *
 * ```tsx
 * <FloatingAnchor display="block">
 *   <button ref={setTrigger}>Open</button>
 *   <FloatingContainer tether={{}}>…</FloatingContainer>
 * </FloatingAnchor>
 * ```
 */
export const FloatingAnchor = (props: FloatingAnchorProps) => {
  const [element, setElement] = createSignal<HTMLElement>();

  const className = () =>
    [css.anchor[props.display], props.class].filter(Boolean).join(' ');

  return (
    <FloatingAnchorContext.Provider value={element}>
      <Dynamic
        component={TAG_BY_DISPLAY[props.display]}
        ref={setElement}
        class={className()}
        data-testid={props.testId}
      >
        {props.children}
      </Dynamic>
    </FloatingAnchorContext.Provider>
  );
};
