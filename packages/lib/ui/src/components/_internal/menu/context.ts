/**
 * Internal contexts shared between a menu's content and its parts. Not
 * exported from `@lib/ui`: callers own the state the parts read.
 */

import { assert } from '@lib/assert';
import { createContext, useContext, type Accessor } from 'solid-js';

/** What every part inside an open menu can reach. */
export interface MenuContextValue {
  /** Closes the menu, as a selection does. */
  close: () => void;

  /** The menu's surface, which holds focus when no item does. */
  surface: Accessor<HTMLElement | undefined>;

  /** Whether a typeahead search is in progress, which claims Space. */
  typingAhead: Accessor<boolean>;

  /**
   * Each item's props, keyed by its element, for the `textValue`
   * typeahead matches it by. Without one, it matches by text content.
   */
  textValues: WeakMap<Element, { readonly textValue?: string }>;
}

export const MenuContext = createContext<MenuContextValue>();

export const useMenuContext = (): MenuContextValue => {
  const ctx = useContext(MenuContext);
  assert(ctx, 'Menu part rendered outside of a menu.');
  return ctx;
};

/** The selection a radio group's items read and write. */
export interface MenuRadioContextValue {
  value: Accessor<string>;
  onValueChange: (value: string) => void;
}

export const MenuRadioContext = createContext<MenuRadioContextValue>();

export const useMenuRadioContext = (): MenuRadioContextValue => {
  const ctx = useContext(MenuRadioContext);
  assert(ctx, 'Menu radio item rendered outside of a radio group.');
  return ctx;
};
