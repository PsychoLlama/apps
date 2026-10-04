/**
 * The state a {@link FloatingRoot} shares with everything under it, in
 * one context.
 *
 * Everything in it lives and dies with the root, and nothing under a
 * root can work without it, so one provider carries the lot. Each
 * concern still reads through a hook of its own — `useAnchorElement`,
 * `useTetherState`, `useTether`, `useFloatingTag` — which picks out its
 * field.
 *
 * Not exported from the floating-ui index. The tether state's write
 * half lives here, and only the window's tether may hold it.
 */

import {
  createContext,
  useContext,
  type Accessor,
  type Signal,
} from 'solid-js';
import { assert } from '@lib/assert';
import type { FloatingRootDisplay } from './root';
import type { TetherState } from './tether/use-tether';

/** What a floating root publishes to its descendants. */
export interface FloatingContextValue {
  /**
   * The anchor element the window positions against. An accessor
   * rather than the element itself: a `ref` lands after the first
   * render, and anything reading the element has to wake up when it
   * does.
   */
  anchor: Accessor<HTMLElement | undefined>;

  /**
   * The slot the window publishes its tether state into — where it
   * landed and the measurement behind it. Read by everything under the
   * root, written by the window's tether alone.
   */
  tether: Signal<TetherState | undefined>;

  /** How the root sits in the flow, which every part inside follows. */
  display: Accessor<FloatingRootDisplay>;
}

export const FloatingContext = createContext<FloatingContextValue>();

/**
 * Read the nearest root's state. Throws outside a root — a floating
 * part with no root is a structural mistake in the tree, not a runtime
 * condition, so it fails the same way on the server and in the browser.
 */
export const useFloatingContext = (): FloatingContextValue => {
  const ctx = useContext(FloatingContext);
  assert(ctx, 'Floating UI rendered outside of <FloatingRoot>.');

  return ctx;
};
