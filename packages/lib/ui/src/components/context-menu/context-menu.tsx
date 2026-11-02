/**
 * ContextMenu component.
 *
 * Ported from Radix UI Themes ContextMenu, on the internal floating-ui
 * primitive in point mode. A menu of actions for an area, opened by a
 * right click or a long press and bound to where it happened: the
 * window measures against that point and flips or shifts to stay on
 * screen.
 *
 * Shares its menu with `DropdownMenu`; the two differ only in what
 * opens it and where it lands.
 *
 * Deviations from Radix:
 * - Upstream's `Root` / `Trigger` / `Content` collapse into
 *   `ContextMenu`: its children are the area, and the menu is the
 *   `content` prop, built from the flat `ContextMenu*` parts.
 * - No submenus. `Sub`, `SubTrigger`, and `SubContent` are gone.
 * - No portal. The menu renders inside the area, so an `overflow`
 *   ancestor can clip it. Same trade as `DropdownMenu`.
 * - Non-modal only. No `modal` prop: nothing outside is made inert,
 *   scroll isn't locked, and the rest of the page isn't hidden from
 *   assistive tech.
 * - Fully controlled: `open` / `onOpenChange`, where upstream keeps the
 *   open state itself and only reports it. The point stays internal.
 * - The area is a `FloatingRoot` wrapper rather than a `<span>` merged
 *   into the child via `asChild`, and carries no `data-state` or
 *   `data-disabled`.
 * - A right click inside the open menu is swallowed. Upstream's reaches
 *   the trigger through the React tree and moves the menu there.
 * - No `loop`, `dir`, or configurable dismissal, as on `DropdownMenu`.
 * - The menu's `color` takes only `accent` or `neutral`. Items take every
 *   semantic palette, since the others only make sense on one action.
 * - `size` is a plain scale, not a responsive object.
 * - Deferred: `highContrast` styling.
 *
 * @see https://www.radix-ui.com/themes/docs/components/context-menu
 */

import {
  createEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
  type JSX,
} from 'solid-js';
import clx from '@lib/classnames';
import {
  FloatingRoot,
  type FloatingElement,
  type FloatingPoint,
  type FloatingRootDisplay,
} from '../_internal/floating-ui';
import {
  MenuContent,
  type MenuSize,
  type MenuVariant,
} from '../_internal/menu/content';
import { NO_SCROLL } from '../_internal/menu/navigation';
import { type RequiredTestIdProps } from '../../props/test-id';
import { useDismissal, type DismissalReason } from '../_internal/use-dismissal';
import { type ContextMenuColor } from './parts';
import * as css from './context-menu.css';

/** How the area sits in the surrounding flow. */
export type ContextMenuDisplay = FloatingRootDisplay;

/** Item metrics and type on a 1–2 scale. */
export type ContextMenuSize = MenuSize;

/** How the focused item is painted. */
export type ContextMenuVariant = MenuVariant;

/**
 * `ContextMenu` props. Wraps an area and floats a menu of actions at
 * the pointer when it's right-clicked or long-pressed.
 */
export interface ContextMenuProps
  extends
    RequiredTestIdProps,
    Omit<
      JSX.HTMLAttributes<FloatingElement>,
      'role' | 'style' | 'children' | 'content' | 'color'
    > {
  /** Whether the menu is showing. */
  open: boolean;

  /**
   * Fires with `true` on a right click or long press in the area, and
   * with `false` when an item is chosen, on Escape, or on a press or
   * focus outside the menu.
   */
  onOpenChange: (open: boolean) => void;

  /**
   * How the area sits in the surrounding flow: `inline` renders it and
   * the menu as `<span>`s, `block` as `<div>`s. Required — the wrong one
   * is invalid markup inside a paragraph or a stray baseline gap under a
   * layout box.
   */
  display: ContextMenuDisplay;

  /**
   * The menu: `ContextMenuItem`s, `ContextMenuCheckboxItem`s,
   * `ContextMenuRadioGroup`s, and the labels, groups, and separators
   * between them.
   */
  content: JSX.Element;

  /**
   * Leaves the area to the browser's own context menu. @default false
   */
  disabled?: boolean;

  /** Item metrics and type on a 1–2 scale. @default 2 */
  size?: ContextMenuSize;

  /** How the focused item is painted. @default 'solid' */
  variant?: ContextMenuVariant;

  /** Palette the focused item is painted in. @default 'accent' */
  color?: ContextMenuColor;

  /** Class merged onto the menu surface. */
  class?: string;

  /** The area that opens the menu. */
  children: JSX.Element;
}

/** The props every menu fills in unless told otherwise. */
const DEFAULTS = {
  disabled: false,
  size: 2,
  variant: 'solid',
  color: 'accent',
} satisfies Partial<ContextMenuProps>;

/** How long a touch or pen has to rest before the menu opens, in ms. */
const LONG_PRESS_DELAY = 700;

/** Gap between the point and the menu, in px. Upstream's. */
const SIDE_OFFSET = 2;

/**
 * Lift along the edge, per step of `size`, in px. Themes' trick to sit
 * the first item, rather than the surface's padding, under the pointer.
 */
const ALIGN_OFFSET_PER_SIZE = -4;

/**
 * A menu of actions for an area, opened at the pointer by a right click
 * or a long press. Choosing an item closes it.
 */
const ContextMenu = (rawProps: ContextMenuProps) => {
  const props = mergeProps(DEFAULTS, rawProps);
  const [local, rest] = splitProps(props, [
    'open',
    'onOpenChange',
    'display',
    'content',
    'disabled',
    'children',
    'testId',
  ]);

  const [root, setRoot] = createSignal<HTMLElement>();
  const [windowElement, setWindowElement] = createSignal<HTMLElement>();
  const [point, setPoint] = createSignal<FloatingPoint>({ x: 0, y: 0 });

  const inMenu = (node: EventTarget | null) =>
    node instanceof Node && windowElement()?.contains(node) === true;

  // Events from the menu bubble through the area, which holds it.
  const fromMenu = (event: Event) => inMenu(event.target);

  // Where focus was before the menu took it, to hand it back on close.
  let previousFocus: HTMLElement | null = null;

  const openAt = (event: MouseEvent) => {
    const area = root();
    if (!area) return;

    const rect = area.getBoundingClientRect();
    setPoint({ x: event.clientX - rect.left, y: event.clientY - rect.top });

    // A menu still closing may hold focus; it's not where to return.
    const active = document.activeElement;
    if (active instanceof HTMLElement && !inMenu(active)) {
      previousFocus = active;
    }

    if (!local.open) local.onOpenChange(true);
  };

  // --- Long press ---

  let longPressTimer: ReturnType<typeof setTimeout> | undefined;
  const clearLongPress = () => clearTimeout(longPressTimer);
  onCleanup(clearLongPress);
  createEffect(() => {
    if (local.disabled) clearLongPress();
  });

  const isTouchOrPen = (event: PointerEvent) => event.pointerType !== 'mouse';

  const onContextMenu = (event: MouseEvent) => {
    if (local.disabled) return;

    // Ours, not the browser's, even over the open menu.
    event.preventDefault();
    if (fromMenu(event)) return;

    // Some platforms turn a long press into `contextmenu` themselves.
    clearLongPress();
    openAt(event);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (local.disabled || !isTouchOrPen(event) || fromMenu(event)) return;

    // A second touch point restarts the wait.
    clearLongPress();
    longPressTimer = setTimeout(() => openAt(event), LONG_PRESS_DELAY);
  };

  const onPointerRelease = (event: PointerEvent) => {
    if (isTouchOrPen(event)) clearLongPress();
  };

  // --- Closing ---

  // Focus goes back where it was on close, unless the user has already
  // put it somewhere else by pressing or focusing outside.
  let returnFocus = true;

  // Bounded by the menu alone: a press anywhere else in the area closes
  // it too, as a right click there moves it.
  useDismissal({
    open: () => local.open,
    root: windowElement,
    dismiss: (reason: DismissalReason) => {
      if (reason === 'outside') returnFocus = false;
      local.onOpenChange(false);
    },
  });

  createEffect(
    on(
      () => local.open,
      (open, wasOpen) => {
        if (open) returnFocus = true;
        else if (wasOpen && returnFocus && previousFocus?.isConnected) {
          previousFocus.focus(NO_SCROLL);
        }
      },
    ),
  );

  return (
    <FloatingRoot
      ref={setRoot}
      display={local.display}
      class={clx(!local.disabled && css.trigger)}
      testId={`${local.testId}-area`}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerRelease}
      onPointerUp={onPointerRelease}
      onPointerCancel={onPointerRelease}
    >
      {local.children}

      <MenuContent
        {...rest}
        open={local.open}
        onClose={() => local.onOpenChange(false)}
        entry={() => 'surface'}
        windowRef={setWindowElement}
        side="right"
        align="start"
        sideOffset={SIDE_OFFSET}
        alignOffset={ALIGN_OFFSET_PER_SIZE * props.size}
        point={point()}
        testId={local.testId}
      >
        {local.content}
      </MenuContent>
    </FloatingRoot>
  );
};

export default ContextMenu;
