/**
 * The open menu shared by `DropdownMenu` and `ContextMenu`: the floating
 * window, the `role="menu"` surface inside it, and everything that
 * happens there — keyboard navigation, typeahead, and where focus lands
 * on open. Opening, closing, and anchoring belong to each menu.
 *
 * Deviations are recorded on each menu.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/menu/src/menu.tsx
 */

import {
  Show,
  createEffect,
  createSignal,
  on,
  onCleanup,
  splitProps,
  type JSX,
} from 'solid-js';
import { flip, limitShift, shift } from '@floating-ui/dom';
import clx from '@lib/classnames';
import type { RadiusScale, SpaceScale } from '@lib/design';
import { type RequiredTestIdProps } from '../../../props/test-id';
import {
  FloatingBody,
  FloatingWindow,
  type FloatingAlignment,
  type FloatingElement,
  type FloatingPoint,
  type FloatingSide,
  type FloatingTether,
} from '../floating-ui';
import { createPresence } from '../presence';
import * as motion from '../window-motion.css';
import { MenuContext } from './context';
import {
  NAVIGATION_KEYS,
  NO_SCROLL,
  enabledItems,
  navigationTarget,
  nextTypeaheadMatch,
} from './navigation';
import { type MenuColor } from './parts';
import * as css from './menu.css';

/** Item metrics and type on a 1–2 scale. */
export type MenuSize = 1 | 2;

/** How the focused item is painted. */
export type MenuVariant = 'solid' | 'soft';

/**
 * Where focus lands as the menu opens: on its first item, as from the
 * keyboard, or on the surface, so the pointer decides what's
 * highlighted.
 */
export type MenuEntry = 'item' | 'surface';

/** `MenuContent` props. */
export interface MenuContentProps
  extends
    RequiredTestIdProps,
    Omit<
      JSX.HTMLAttributes<FloatingElement>,
      'role' | 'style' | 'children' | 'content' | 'color'
    > {
  /** Whether the menu is showing. */
  open: boolean;

  /** Closes the menu, as choosing an item does. */
  onClose: () => void;

  /** Where focus lands as the menu opens. Read once per open. */
  entry: () => MenuEntry;

  side: FloatingSide;
  align: FloatingAlignment;
  sideOffset: number;
  alignOffset: number;

  /** Binds the menu to a point inside the anchor rather than an edge. */
  point?: FloatingPoint;

  size: MenuSize;
  variant: MenuVariant;
  color: MenuColor;

  /** Class merged onto the surface. */
  class?: string;

  /** The positioned window, for a menu that bounds dismissal by it. */
  windowRef?: (window: HTMLElement) => void;

  /** The menu's parts. */
  children: JSX.Element;
}

/** Themes' padding and radius for each size. */
const SURFACE_BY_SIZE: Record<
  MenuSize,
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

/**
 * The open menu, floating against the nearest `FloatingRoot`. Mounts
 * while open and through its exit.
 */
export const MenuContent = (props: MenuContentProps) => {
  const [local, rest] = splitProps(props, [
    'open',
    'onClose',
    'entry',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'point',
    'size',
    'variant',
    'color',
    'class',
    'windowRef',
    'children',
    'testId',
  ]);

  const [surfaceElement, setSurfaceElement] = createSignal<HTMLElement>();
  const [windowElement, setWindowElement] = createSignal<HTMLElement>();

  // Holds the window mounted while its exit plays.
  const presence = createPresence({
    open: () => local.open,
    element: windowElement,
  });
  const surface = () => SURFACE_BY_SIZE[local.size];

  const setWindow = (element: HTMLElement) => {
    setWindowElement(element);
    local.windowRef?.(element);
  };

  // Into the menu once it's on the page, as on `Popover`. A surface left
  // over from an earlier open is detached, and skipped.
  createEffect(
    on([() => local.open, surfaceElement], ([open, element]) => {
      if (!open || !element?.isConnected) return;

      const first = local.entry() === 'item' ? enabledItems(element)[0] : null;
      (first ?? element).focus(NO_SCROLL);
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
    <Show when={presence.mounted()}>
      <FloatingWindow
        {...presence.props}
        ref={setWindow}
        class={motion.window}
        side={local.side}
        align={local.align}
        sideOffset={local.sideOffset}
        alignOffset={local.alignOffset}
        point={local.point}
        radius={surface().radius}
        tether={TETHER}
        testId={local.testId}
      >
        <MenuContext.Provider
          value={{
            close: () => local.onClose(),
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
            testId={`${local.testId}-surface`}
          >
            {local.children}
          </FloatingBody>
        </MenuContext.Provider>
      </FloatingWindow>
    </Show>
  );
};
