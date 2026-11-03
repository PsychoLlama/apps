/**
 * DropdownMenu component.
 *
 * Ported from Radix UI Themes DropdownMenu, on the internal floating-ui
 * primitive, as `Popover` is. A menu of actions bound to its trigger:
 * the window measures against the trigger and flips or shifts to stay
 * on screen.
 *
 * Deviations from Radix:
 * - Upstream's `Root` / `Trigger` / `Content` collapse into
 *   `DropdownMenu`, as on `Popover`: the trigger is the render
 *   function's element, and the menu is the `content` prop, built from
 *   the flat `DropdownMenu*` parts.
 * - No submenus. `Sub`, `SubTrigger`, and `SubContent` are gone.
 * - No portal. The menu renders next to its trigger, inline, so an
 *   `overflow` ancestor can clip it. Same trade as `Popover`.
 * - Non-modal only. No `modal` prop: nothing outside is made inert,
 *   scroll isn't locked, and the rest of the page isn't hidden from
 *   assistive tech. A press outside closes the menu and still lands
 *   where it was aimed.
 * - Fully controlled: `open` / `onOpenChange` on the menu, `checked` /
 *   `onCheckedChange` on checkbox items, `value` / `onValueChange` on
 *   radio groups. No `defaultOpen`, `defaultValue`, or internal state.
 * - `display` is required, from the floating root, as on `Popover`.
 * - `children` is a render function. Upstream merges its ARIA and
 *   handlers into the child via `asChild`; here the trigger is handed
 *   them as props and spreads them itself.
 * - No `asChild` on items, so no link items. Deferred.
 * - No `loop`; arrow keys stop at either end, upstream's default. No
 *   `dir`, so no right-to-left.
 * - Dismissal isn't configurable, as on `Popover`: no `onEscapeKeyDown`,
 *   `onPointerDownOutside`, `onFocusOutside`, `onInteractOutside`,
 *   `onCloseAutoFocus`, or `onEntryFocus`. Nor are `collisionPadding`,
 *   `sticky`, `avoidCollisions`, `forceMount`, or `container`.
 * - Item `onSelect` is handed a plain cancellable `Event` rather than one
 *   dispatched through the DOM, so it can't be heard from an ancestor.
 *   Items don't take the click, key, and pointer handlers they own.
 * - Typeahead tracks its match by position, so items sharing a label
 *   are each reachable. Upstream matches by label and stalls on the
 *   first.
 * - An indeterminate checkbox item shows a dash. Upstream shows the
 *   check.
 * - `size` is a plain scale, not a responsive object.
 * - The menu's `color` takes only `accent` or `neutral`. Items take every
 *   semantic palette, since the others only make sense on one action.
 * - Deferred: `highContrast` styling.
 *
 * @see https://www.radix-ui.com/themes/docs/components/dropdown-menu
 */

import {
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  on,
  splitProps,
  type JSX,
} from 'solid-js';
import {
  FloatingRoot,
  type FloatingAlignment,
  type FloatingElement,
  type FloatingRootDisplay,
  type FloatingSide,
} from '../_internal/floating-ui';
import {
  MenuContent,
  type MenuEntry,
  type MenuSize,
  type MenuVariant,
} from '../_internal/menu/content';
import { NO_SCROLL } from '../_internal/menu/navigation';
import { type RequiredTestIdProps } from '../../props/test-id';
import { useDismissal, type DismissalReason } from '../_internal/use-dismissal';
import { type DropdownMenuColor } from './parts';

/** Edge of the trigger the menu binds to. */
export type DropdownMenuSide = FloatingSide;

/** Placement along that edge. */
export type DropdownMenuAlign = FloatingAlignment;

/** How the wrapper around the trigger sits in the surrounding flow. */
export type DropdownMenuDisplay = FloatingRootDisplay;

/** Item metrics and type on a 1–2 scale. */
export type DropdownMenuSize = MenuSize;

/** How the focused item is painted. */
export type DropdownMenuVariant = MenuVariant;

/**
 * What the menu hands its trigger. Spread onto the button as-is: the
 * ARIA names the relationship, a press toggles the menu, and Enter,
 * Space, or ArrowDown open it from the keyboard. A trigger with
 * handlers of its own has to call both.
 */
export interface DropdownMenuTriggerProps {
  /** Names the menu, which is labelled by its trigger. */
  readonly id: string;

  /** Announces that the button opens a menu. */
  readonly 'aria-haspopup': 'menu';

  /** Whether the menu is open. */
  readonly 'aria-expanded': boolean;

  /** Id of the menu, while it's open. */
  readonly 'aria-controls': string | undefined;

  /** Toggles the menu on a primary press. */
  readonly onPointerDown: (event: PointerEvent) => void;

  /** Opens and closes the menu from the keyboard. */
  readonly onKeyDown: (event: KeyboardEvent) => void;

  /** Where focus returns when the menu closes. */
  readonly ref: (element: HTMLElement) => void;
}

/**
 * `DropdownMenu` props. Wraps its trigger and floats a menu of actions
 * next to it while open.
 */
export interface DropdownMenuProps
  extends
    RequiredTestIdProps,
    Omit<
      JSX.HTMLAttributes<FloatingElement>,
      'role' | 'style' | 'children' | 'content' | 'color'
    > {
  /** Whether the menu is showing. */
  open: boolean;

  /**
   * Fires when the trigger asks to open or close, with `false` when an
   * item is chosen, and with `false` on Escape, a press outside, or
   * focus moving outside.
   */
  onOpenChange: (open: boolean) => void;

  /**
   * How the wrapper around the trigger sits in the surrounding flow:
   * `inline` renders it and the menu as `<span>`s, `block` as `<div>`s.
   * Required — the wrong one is invalid markup inside a paragraph or a
   * stray baseline gap under a layout box.
   */
  display: DropdownMenuDisplay;

  /**
   * The menu: `DropdownMenuItem`s, `DropdownMenuCheckboxItem`s,
   * `DropdownMenuRadioGroup`s, and the labels, groups, and separators
   * between them.
   */
  content: JSX.Element;

  /** Edge of the trigger the menu binds to. @default 'bottom' */
  side?: DropdownMenuSide;

  /** Placement along that edge. @default 'start' */
  align?: DropdownMenuAlign;

  /** Gap between the trigger and the menu, in px. @default 4 */
  sideOffset?: number;

  /**
   * Nudge along the bound edge, in px. Ignored when centered.
   * @default 0
   */
  alignOffset?: number;

  /** Item metrics and type on a 1–2 scale. @default 2 */
  size?: DropdownMenuSize;

  /** How the focused item is painted. @default 'solid' */
  variant?: DropdownMenuVariant;

  /** Palette the focused item is painted in. @default 'accent' */
  color?: DropdownMenuColor;

  /** Class merged onto the menu surface. */
  class?: string;

  /**
   * Renders the trigger: a single button, with the given props spread
   * onto it.
   */
  children: (trigger: DropdownMenuTriggerProps) => JSX.Element;
}

/** The props every menu fills in unless told otherwise. */
const DEFAULTS = {
  side: 'bottom',
  align: 'start',
  sideOffset: 4,
  alignOffset: 0,
  size: 2,
  variant: 'solid',
  color: 'accent',
} satisfies Partial<DropdownMenuProps>;

/**
 * A menu of actions that floats beside its trigger while open. Choosing
 * an item closes it.
 */
const DropdownMenu = (rawProps: DropdownMenuProps) => {
  const props = mergeProps(DEFAULTS, rawProps);
  const [local, rest] = splitProps(props, [
    'open',
    'onOpenChange',
    'display',
    'content',
    'children',
  ]);

  const [root, setRoot] = createSignal<HTMLElement>();
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const triggerId = createUniqueId();
  const contentId = createUniqueId();

  // A keyboard open lands on the first item; a press lands on the
  // surface, so the pointer decides what's highlighted.
  let entry: MenuEntry = 'surface';

  const toggle = (by: MenuEntry) => {
    entry = by;
    local.onOpenChange(!local.open);
  };

  const triggerProps: DropdownMenuTriggerProps = {
    id: triggerId,
    'aria-haspopup': 'menu',
    get 'aria-expanded'() {
      return local.open;
    },
    get 'aria-controls'() {
      return local.open ? contentId : undefined;
    },
    onPointerDown: (event) => {
      // The primary button only, and not a macOS ctrl-click, which is a
      // right click. Disabled buttons still hear pointer events.
      const button = event.currentTarget as HTMLElement;
      if (event.button !== 0 || event.ctrlKey || button.matches(':disabled'))
        return;

      // Keeps focus off the trigger, so the surface takes it unopposed.
      if (!local.open) event.preventDefault();
      toggle('surface');
    },
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') toggle('item');
      else if (event.key === 'ArrowDown') {
        entry = 'item';
        local.onOpenChange(true);
      } else return;

      // No page scroll, and no keydown reaching the item that takes
      // focus, which would choose it on the spot.
      event.preventDefault();
    },
    ref: setTrigger,
  };

  // Focus goes back to the trigger on close, unless the user has already
  // put it somewhere else by pressing or focusing outside.
  let returnFocus = true;

  useDismissal({
    open: () => local.open,
    root,
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
        else {
          // An open the trigger didn't ask for lands on the surface.
          entry = 'surface';
          if (wasOpen && returnFocus) trigger()?.focus(NO_SCROLL);
        }
      },
    ),
  );

  return (
    <FloatingRoot ref={setRoot} display={local.display}>
      {local.children(triggerProps)}

      <MenuContent
        {...rest}
        open={local.open}
        onClose={() => local.onOpenChange(false)}
        entry={() => entry}
        aria-labelledby={triggerId}
        id={contentId}
      >
        {local.content}
      </MenuContent>
    </FloatingRoot>
  );
};

export default DropdownMenu;
