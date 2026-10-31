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
 * - `color` accepts every semantic palette, on the menu and its items.
 * - Deferred: `highContrast` styling.
 *
 * @see https://www.radix-ui.com/themes/docs/components/dropdown-menu
 */

import {
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  on,
  onCleanup,
  splitProps,
  type JSX,
} from 'solid-js';
import { flip, limitShift, shift } from '@floating-ui/dom';
import clx from '@lib/classnames';
import type { RadiusScale, SpaceScale } from '@lib/design';
import {
  FloatingBody,
  FloatingRoot,
  FloatingWindow,
  type FloatingAlignment,
  type FloatingElement,
  type FloatingRootDisplay,
  type FloatingSide,
  type FloatingTether,
} from '../_internal/floating-ui';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { createPresence } from '../_internal/presence';
import { useDismissal, type DismissalReason } from '../_internal/use-dismissal';
import * as motion from '../_internal/window-motion.css';
import { DropdownMenuContext } from './context';
import {
  NAVIGATION_KEYS,
  NO_SCROLL,
  enabledItems,
  navigationTarget,
  nextTypeaheadMatch,
} from './navigation';
import { type DropdownMenuColor } from './parts';
import * as css from './dropdown-menu.css';

/** Edge of the trigger the menu binds to. */
export type DropdownMenuSide = FloatingSide;

/** Placement along that edge. */
export type DropdownMenuAlign = FloatingAlignment;

/** How the wrapper around the trigger sits in the surrounding flow. */
export type DropdownMenuDisplay = FloatingRootDisplay;

/** Item metrics and type on a 1–2 scale. */
export type DropdownMenuSize = 1 | 2;

/** How the focused item is painted. */
export type DropdownMenuVariant = 'solid' | 'soft';

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

/** Themes' padding and radius for each size. */
const SURFACE_BY_SIZE: Record<
  DropdownMenuSize,
  { padding: SpaceScale; radius: RadiusScale }
> = {
  1: { padding: 1, radius: 3 },
  2: { padding: 2, radius: 4 },
};

/** Themes' collision settings, resolved once for every menu. */
const TETHER: FloatingTether = {
  middleware: [
    shift({ padding: css.COLLISION_PADDING, limiter: limitShift() }),
    flip({ padding: css.COLLISION_PADDING }),
  ],
};

/** How long a typeahead search waits for the next key, in ms. */
const TYPEAHEAD_TIMEOUT = 1000;

/** How the menu was last asked to open, which decides where focus lands. */
type Opener = 'keyboard' | 'pointer';

/**
 * A menu of actions that floats beside its trigger while open. Choosing
 * an item closes it.
 */
const DropdownMenu = (rawProps: DropdownMenuProps) => {
  const props = mergeProps(DEFAULTS, rawProps);
  const [tid, withoutTid] = splitProps(props, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'open',
    'onOpenChange',
    'display',
    'content',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'size',
    'variant',
    'color',
    'class',
    'children',
  ]);

  const [root, setRoot] = createSignal<HTMLElement>();
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const [surfaceElement, setSurfaceElement] = createSignal<HTMLElement>();
  const [windowElement, setWindowElement] = createSignal<HTMLElement>();

  // Holds the window mounted while its exit plays.
  const presence = createPresence({
    open: () => local.open,
    element: windowElement,
  });
  const triggerId = createUniqueId();
  const contentId = createUniqueId();
  const surface = () => SURFACE_BY_SIZE[local.size];

  // A keyboard open lands on the first item; a press lands on the
  // surface, so the pointer decides what's highlighted.
  let opener: Opener = 'pointer';

  const toggle = (by: Opener) => {
    opener = by;
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
      toggle('pointer');
    },
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') toggle('keyboard');
      else if (event.key === 'ArrowDown') {
        opener = 'keyboard';
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
        else if (wasOpen && returnFocus) trigger()?.focus(NO_SCROLL);
      },
    ),
  );

  // Into the menu once it's on the page, as on `Popover`. A surface left
  // over from an earlier open is detached, and skipped.
  createEffect(
    on([() => local.open, surfaceElement], ([open, element]) => {
      if (!open || !element?.isConnected) return;

      const first = opener === 'keyboard' ? enabledItems(element)[0] : null;
      (first ?? element).focus(NO_SCROLL);
      opener = 'pointer';
    }),
  );

  // --- Typeahead ---

  const [search, setSearch] = createSignal('');
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(searchTimer));

  // Forgets the search a second after the last key.
  const updateSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer);
    if (value !== '') {
      searchTimer = setTimeout(() => updateSearch(''), TYPEAHEAD_TIMEOUT);
    }
  };

  const textValues = new WeakMap<Element, { readonly textValue?: string }>();
  const textOf = (item: HTMLElement) =>
    textValues.get(item)?.textValue ?? item.textContent.trim();

  const typeahead = (element: HTMLElement, key: string) => {
    const query = search() + key;
    updateSearch(query);

    const items = enabledItems(element);
    const current = items.findIndex((item) => item === document.activeElement);
    const match = nextTypeaheadMatch(items.map(textOf), query, current);

    if (match !== undefined) items[match].focus(NO_SCROLL);
  };

  // --- Keyboard ---

  const onKeyDown = (event: KeyboardEvent) => {
    const element = event.currentTarget as HTMLElement;

    // Menus aren't navigated with Tab.
    if (event.key === 'Tab') {
      event.preventDefault();
      return;
    }

    const modified = event.ctrlKey || event.altKey || event.metaKey;
    if (!modified && event.key.length === 1) {
      typeahead(element, event.key);
      if (event.key === ' ') event.preventDefault();
      return;
    }

    if (!NAVIGATION_KEYS.has(event.key)) return;

    event.preventDefault();
    const from = event.target === element ? null : (event.target as Element);
    navigationTarget(enabledItems(element), from, event.key)?.focus(NO_SCROLL);
  };

  // Leaving the menu drops a search in progress.
  const onFocusOut = (event: FocusEvent) => {
    const element = event.currentTarget as HTMLElement;
    if (!element.contains(event.relatedTarget as Node | null)) {
      updateSearch('');
    }
  };

  return (
    <FloatingRoot ref={setRoot} display={local.display}>
      {local.children(triggerProps)}

      <Show when={presence.mounted()}>
        <FloatingWindow
          {...presence.props}
          ref={setWindowElement}
          class={motion.window}
          side={local.side}
          align={local.align}
          sideOffset={local.sideOffset}
          alignOffset={local.alignOffset}
          radius={surface().radius}
          tether={TETHER}
          testId={tid.testId}
        >
          <DropdownMenuContext.Provider
            value={{
              close: () => local.onOpenChange(false),
              surface: surfaceElement,
              typingAhead: () => search() !== '',
              textValues,
            }}
          >
            <FloatingBody
              {...rest}
              ref={setSurfaceElement}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby={triggerId}
              id={contentId}
              tabindex={-1}
              p={surface().padding}
              class={clx(
                css.content,
                css.size[local.size],
                css.color[local.color],
                css.variant[local.variant],
                local.class,
              )}
              onKeyDown={onKeyDown}
              onFocusOut={onFocusOut}
              testId={`${tid.testId}-surface`}
            >
              {local.content}
            </FloatingBody>
          </DropdownMenuContext.Provider>
        </FloatingWindow>
      </Show>
    </FloatingRoot>
  );
};

export default DropdownMenu;
